import { describe, expect, it } from 'vitest';
import { block, contractText, keys, readWorkflow, scalar, steps } from '../support/repository-files';

const profile = contractText('Profilo di sicurezza dei workflow GitHub Actions');
const names = ['ci.yml', 'secret-scan.yml', 'publish-image.yml'] as const;
const workflows = new Map(names.map(name => [name, readWorkflow(name)]));
const workflow = (name: (typeof names)[number]) => workflows.get(name) ?? readWorkflow(name);

/** Pinned actions of the profile: `owner/action@sha` (vN). */
const pins = new Map([...profile.matchAll(/`([\w-]+\/[\w-]+)@([0-9a-f]{40})` \((v\d+)\)/g)]
  .map(([, action, sha, version]) => [action ?? '', { sha, version }]));

const allJobs = names.flatMap(name => [...workflow(name).jobs].map(([id, text]) => ({ workflow: name, id, text })));
const allSteps = allJobs.flatMap(job => steps(job.text));

describe('GitHub Actions workflow security profile', () => {
  it('reads the four pinned actions from the profile', () => {
    expect([...pins.keys()].sort()).toEqual([
      'actions/checkout', 'actions/setup-node', 'docker/setup-buildx-action', 'docker/setup-qemu-action',
    ]);
  });

  it('grants only contents: read at the top level of every workflow', () => {
    for (const name of names) {
      expect(block(workflow(name).text, 'permissions').split('\n').filter(line => line.trim()), name)
        .toEqual(['  contents: read']);
    }
  });

  it('grants packages: write only to the publish job', () => {
    const jobPermissions = allJobs.filter(job => block(job.text, 'permissions', 4) !== '')
      .map(job => ({ id: `${job.workflow}#${job.id}`, permissions: block(job.text, 'permissions', 4).split('\n').filter(line => line.trim()) }));
    expect(jobPermissions).toEqual([
      { id: 'publish-image.yml#publish', permissions: ['      contents: read', '      packages: write'] },
    ]);
    const writes = names.flatMap(name => workflow(name).text.split('\n').filter(line => /:\s*write\b/.test(line)));
    expect(writes).toEqual(['      packages: write']);
  });

  it('pins every external action to the commit and version of the profile', () => {
    const uses = names.flatMap(name => workflow(name).text.split('\n')
      .filter(line => /^\s*(?:- )?uses:/.test(line)).map(line => line.trim().replace(/^- /, '')));
    const external = uses.filter(line => !line.startsWith('uses: ./'));
    expect(external.length).toBeGreaterThan(0);
    for (const line of external) {
      const match = /^uses: ([\w-]+\/[\w-]+)@([0-9a-f]{40}) # (v\d+)$/.exec(line);
      expect(match, line).not.toBeNull();
      const pin = pins.get(match?.[1] ?? '');
      expect(pin, line).toBeDefined();
      expect({ sha: match?.[2], version: match?.[3] }, line).toEqual(pin);
    }
    const local = uses.filter(line => line.startsWith('uses: ./'));
    expect(local.sort()).toEqual(['uses: ./.github/workflows/ci.yml', 'uses: ./.github/workflows/secret-scan.yml']);
  });

  it('disables the package manager cache of actions/setup-node', () => {
    const setups = allSteps.filter(step => /uses: actions\/setup-node@/.test(step));
    expect(setups.length).toBeGreaterThan(0);
    for (const step of setups) expect(scalar(block(step, 'with', 8), 'package-manager-cache', 10)).toBe('false');
  });

  it('limits the duration of every job on ubuntu-24.04', () => {
    const runnerJobs = allJobs.filter(job => scalar(job.text, 'uses', 4) === undefined)
      .map(job => ({ id: job.id, runner: scalar(job.text, 'runs-on', 4), timeout: scalar(job.text, 'timeout-minutes', 4) }));
    expect(runnerJobs).toEqual([
      { id: 'checks', runner: 'ubuntu-24.04', timeout: '15' },
      { id: 'gitleaks', runner: 'ubuntu-24.04', timeout: '10' },
      { id: 'publish', runner: 'ubuntu-24.04', timeout: '45' },
    ]);
    expect(profile).toContain('15 per i controlli di `ci.yml`, 10 per gitleaks in `secret-scan.yml` e 45 per `publish`');
  });

  it('does not persist the checkout credentials', () => {
    const checkouts = allSteps.filter(step => /uses: actions\/checkout@/.test(step));
    expect(checkouts.length).toBe(3);
    for (const step of checkouts) expect(scalar(block(step, 'with', 8), 'persist-credentials', 10)).toBe('false');
  });

  it('passes the GHCR token through the environment and always logs out', () => {
    const login = allSteps.find(step => step.includes('docker login')) ?? '';
    expect(scalar(block(login, 'env', 8), 'GHCR_TOKEN', 10)).toBe('${{ secrets.GITHUB_TOKEN }}');
    expect(login).toContain(`printf '%s' "$GHCR_TOKEN" | docker login ghcr.io --username "$GITHUB_ACTOR" --password-stdin`);
    const runs = allSteps.map(step => block(step, 'run', 8) + (scalar(step, 'run', 8) ?? ''));
    expect(runs.filter(run => run.includes('${{ secrets.'))).toEqual([]);
    const logout = allSteps.find(step => step.includes('docker logout')) ?? '';
    expect(scalar(logout, 'if', 8)).toBe('always()');
    expect(scalar(logout, 'run', 8)).toBe('docker logout ghcr.io');
    expect(allSteps.indexOf(logout)).toBe(allSteps.length - 1);
  });

  it('reuses the CI and the secret scan through workflow_call', () => {
    for (const name of ['ci.yml', 'secret-scan.yml'] as const) {
      expect(keys(block(workflow(name).text, 'on')), name).toContain('workflow_call');
    }
    const publish = workflow('publish-image.yml');
    expect(scalar(publish.jobs.get('checks') ?? '', 'uses', 4)).toBe('./.github/workflows/ci.yml');
    expect(scalar(publish.jobs.get('secret-scan') ?? '', 'uses', 4)).toBe('./.github/workflows/secret-scan.yml');
  });

  it('serialises the publications of the same tag without cancelling them', () => {
    const concurrency = block(workflow('publish-image.yml').text, 'concurrency');
    expect(scalar(concurrency, 'group', 2)).toBe('web-release-${{ github.ref }}');
    expect(scalar(concurrency, 'cancel-in-progress', 2)).toBe('false');
    expect(profile).toContain('gruppo `web-release-${{ github.ref }}` e `cancel-in-progress: false`');
  });
});
