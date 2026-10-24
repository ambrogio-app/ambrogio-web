import { describe, expect, it } from 'vitest';
import { block, capture, job, readWorkflow, runOf, scalar, stepNamed, steps } from '../support/repository-files';

const workflow = readWorkflow('publish-image.yml');
const publish = job(workflow, 'publish');
const publishSteps = steps(publish);
const validation = runOf(stepNamed(publishSteps, 'Validate release version'));

describe('image publication workflow', () => {
  it('runs only when a v* tag is pushed', () => {
    expect(block(workflow.text, 'on').split('\n').map(line => line.trimEnd()).filter(Boolean))
      .toEqual(['  push:', "    tags: ['v*']"]);
  });

  it('accepts only vMAJOR.MINOR.PATCH tags without leading zeros', () => {
    const pattern = new RegExp(capture(validation, /=~ (\^v\S+\$) \]\]/));
    for (const tag of ['v0.1.0', 'v1.2.3', 'v10.20.30']) expect(pattern.test(tag), tag).toBe(true);
    for (const tag of ['v1.2', 'v01.2.3', 'v1.02.3', 'v1.2.03', 'v1.2.3-rc1', '1.2.3', 'v1.2.3.4', 'latest']) {
      expect(pattern.test(tag), tag).toBe(false);
    }
    expect(validation).toContain('exit 1');
  });

  it('requires the package.json version to match the tag', () => {
    expect(validation).toContain(`version=$(node -p "require('./package.json').version")`);
    expect(validation).toContain('test "$version" = "${GITHUB_REF_NAME#v}"');
    expect(validation.split('\n')[0]).toBe('set -euo pipefail');
  });

  it('publishes only after the CI and the secret scan of the same commit', () => {
    expect(scalar(job(workflow, 'checks'), 'uses', 4)).toBe('./.github/workflows/ci.yml');
    expect(scalar(job(workflow, 'secret-scan'), 'uses', 4)).toBe('./.github/workflows/secret-scan.yml');
    expect(scalar(publish, 'needs', 4)).toBe('[checks, secret-scan]');
    expect([...workflow.jobs.keys()]).toEqual(['checks', 'secret-scan', 'publish']);
  });

  it('builds and verifies both architectures before any push', () => {
    const buildIndex = publishSteps.indexOf(stepNamed(publishSteps, 'Build and verify both images'));
    const build = runOf(publishSteps[buildIndex] ?? '');
    expect(build).toContain('for arch in amd64 arm64; do');
    expect(build).toContain('docker buildx build --platform "linux/$arch" --load');
    expect(build).toContain('--tag "$IMAGE-$arch" .');
    expect(build).toContain('node scripts/verify-docker-image.mjs "$IMAGE-$arch" "$arch"');
    expect(build.indexOf('docker buildx build')).toBeLessThan(build.indexOf('verify-docker-image.mjs'));
    expect(build.split('\n')[0]).toBe('set -euo pipefail');

    const pushes = publishSteps.map((step, index) => [index, step] as const)
      .filter(([, step]) => /docker push|--push\b|imagetools create/.test(step)).map(([index]) => index);
    expect(pushes.length).toBeGreaterThan(0);
    expect(pushes.every(index => index > buildIndex)).toBe(true);
  });

  it('sets up arm64 emulation and builds the image of the registry for the tag', () => {
    expect(scalar(block(stepNamed(publishSteps, 'Set up ARM emulation'), 'with', 8), 'platforms', 10)).toBe('arm64');
    expect(validation).toContain('echo "IMAGE=ghcr.io/ambrogio-app/ambrogio-web:$GITHUB_REF_NAME" >> "$GITHUB_ENV"');
  });

  it('pushes the verified images and joins them in the release manifest with both platforms', () => {
    const release = runOf(stepNamed(publishSteps, 'Publish verified images and release manifest'));
    expect(release.split('\n')).toEqual([
      'set -euo pipefail',
      'docker push "$IMAGE-amd64"',
      'docker push "$IMAGE-arm64"',
      'docker buildx imagetools create --tag "$IMAGE" "$IMAGE-amd64" "$IMAGE-arm64"',
      'docker buildx imagetools inspect --raw "$IMAGE" > "$RUNNER_TEMP/release-manifest.json"',
      `jq -e '[.manifests[].platform | select(.os == "linux") | .architecture] | sort == ["amd64", "arm64"]' "$RUNNER_TEMP/release-manifest.json"`,
      'echo "Published $IMAGE" >> "$GITHUB_STEP_SUMMARY"',
    ]);
  });

  it('never publishes a latest tag', () => {
    expect(workflow.text).not.toMatch(/latest/i);
  });
});
