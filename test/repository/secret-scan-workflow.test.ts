import { existsSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fakeGitHubToken, GitSandbox, requireGitleaks } from '../support/git-sandbox';
import {
  block, capture, commonContractText, contractText, job, readWorkflow, runOf, scalar, stepNamed, steps,
} from '../support/repository-files';

const workflow = readWorkflow('secret-scan.yml');
const gitleaks = job(workflow, 'gitleaks');
const gitleaksSteps = steps(gitleaks);
const profile = commonContractText('Profilo di scansione dei segreti con gitleaks');
const webProfile = contractText('Profilo di scansione dei segreti della chat web');

describe('secret scan workflow', () => {
  it('runs on pushes to every branch, pull requests, manual runs and calls from other workflows', () => {
    const triggers = block(workflow.text, 'on');
    expect(scalar(triggers, 'branches', 4)).toBe("['**']");
    expect(triggers.split('\n').map(line => line.trimEnd()).filter(Boolean))
      .toEqual(['  push:', "    branches: ['**']", '  pull_request:', '  workflow_dispatch:', '  workflow_call:']);
  });

  it('checks out the whole history without persisting credentials', () => {
    expect(scalar(gitleaks, 'name', 4)).toBe('Gitleaks');
    const checkout = stepNamed(gitleaksSteps, 'Check out the whole history');
    expect(checkout).toMatch(/uses: actions\/checkout@[0-9a-f]{40} /);
    expect(scalar(block(checkout, 'with', 8), 'fetch-depth', 10)).toBe('0');
    expect(scalar(block(checkout, 'with', 8), 'persist-credentials', 10)).toBe('false');
    expect(profile).toContain('`fetch-depth: 0`');
    expect(webProfile).toContain('con il job `Gitleaks`');
  });

  it('installs the gitleaks release of the profile and checks its SHA-256 before extracting it', () => {
    const version = capture(profile, /usa gitleaks (\d+\.\d+\.\d+)/);
    const archive = capture(profile, /archivio `(gitleaks_[^`]+\.tar\.gz)`/);
    const sha256 = capture(profile, /SHA-256 `([0-9a-f]{64})`/);
    const env = block(gitleaks, 'env', 4);
    expect(scalar(env, 'GITLEAKS_VERSION', 6)).toBe(version);
    expect(scalar(env, 'GITLEAKS_SHA256', 6)).toBe(sha256);
    expect(archive).toBe(`gitleaks_${version}_linux_x64.tar.gz`);

    const install = runOf(stepNamed(gitleaksSteps, 'Install gitleaks'));
    expect(install.split('\n')[0]).toBe('set -euo pipefail');
    expect(install).toContain('archive="gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"');
    expect(install).toContain('"https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/${archive}"');
    expect(install).toContain('curl -fsSL');
    const check = install.indexOf('echo "${GITLEAKS_SHA256}  $RUNNER_TEMP/$archive" | sha256sum --check --strict');
    expect(check).toBeGreaterThan(0);
    expect(install.indexOf('tar -xzf')).toBeGreaterThan(check);
  });

  it('scans the history with redaction and a failing exit code', () => {
    expect(runOf(stepNamed(gitleaksSteps, 'Scan the history'))).toBe('gitleaks git --redact --no-banner --exit-code 1 .');
    expect(profile).toContain('`gitleaks git --redact --no-banner --exit-code 1 .`');
  });

  describe('scan command on a temporary history', () => {
    const command = runOf(stepNamed(gitleaksSteps, 'Scan the history')).split(' ');
    let sandbox: GitSandbox;

    beforeEach(() => {
      requireGitleaks();
      sandbox = new GitSandbox();
    });

    afterEach(() => {
      const directory = sandbox.directory;
      sandbox.remove();
      expect(existsSync(directory)).toBe(false);
    });

    it('fails on a committed secret without printing its value', () => {
      const token = fakeGitHubToken();
      sandbox.write('settings.txt', `github_token = "${token}"\n`);
      sandbox.mustRun('git', ['add', 'settings.txt']);
      sandbox.mustRun('git', ['commit', '--quiet', '-m', 'Add settings']);
      sandbox.write('settings.txt', 'github_token = ""\n');
      sandbox.mustRun('git', ['commit', '--quiet', '-am', 'Remove the token']);

      const result = sandbox.run(command[0] ?? '', command.slice(1));

      expect(result.status).toBe(1);
      expect(result.output).toContain('leaks found: 1');
      expect(result.output).not.toContain(token);
      expect(result.output).not.toContain(token.slice(4));
    });

    it('passes on a history without secrets', () => {
      sandbox.write('notes.txt', 'Nothing secret here.\n');
      sandbox.mustRun('git', ['add', 'notes.txt']);
      sandbox.mustRun('git', ['commit', '--quiet', '-m', 'Add notes']);

      const result = sandbox.run(command[0] ?? '', command.slice(1));

      expect(result.status).toBe(0);
      expect(result.output).toContain('no leaks found');
    });
  });
});
