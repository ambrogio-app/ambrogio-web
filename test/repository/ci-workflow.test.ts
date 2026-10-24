import { describe, expect, it } from 'vitest';
import { block, job, readRepositoryFile, readWorkflow, runOf, scalar, stepNamed, steps } from '../support/repository-files';

const workflow = readWorkflow('ci.yml');
const checks = job(workflow, 'checks');
const checkSteps = steps(checks);
const commands = checkSteps.map(runOf);

/** Position of the step whose commands are `fragment`, otherwise contain it; fails when no step does. */
function position(fragment: string): number {
  const exact = commands.indexOf(fragment);
  const index = exact >= 0 ? exact : commands.findIndex(command => command.includes(fragment));
  if (index < 0) throw new Error(`no step runs ${fragment}`);
  return index;
}

describe('CI workflow', () => {
  it('runs on pushes to main, pull requests, manual runs and calls from other workflows', () => {
    expect(block(workflow.text, 'on').split('\n').map(line => line.trimEnd()).filter(Boolean))
      .toEqual(['  pull_request:', '  push:', '    branches: [main]', '  workflow_dispatch:', '  workflow_call:']);
  });

  it('has the single checks job named as the required status check', () => {
    expect([...workflow.jobs.keys()]).toEqual(['checks']);
    expect(scalar(checks, 'name', 4)).toBe('Web client checks');
  });

  it('sets up Node.js 24, enables pnpm through Corepack before any pnpm command and installs frozen dependencies', () => {
    const node = stepNamed(checkSteps, 'Set up Node.js');
    expect(node).toMatch(/uses: actions\/setup-node@/);
    expect(scalar(block(node, 'with', 8), 'node-version', 10)).toBe("'24'");
    expect(scalar(block(checks, 'env', 4), 'COREPACK_ENABLE_DOWNLOAD_PROMPT', 6)).toBe("'0'");
    const corepack = checkSteps.indexOf(stepNamed(checkSteps, 'Enable Corepack'));
    expect(runOf(checkSteps[corepack] ?? '')).toBe('corepack enable');
    expect(checkSteps.indexOf(node)).toBeLessThan(corepack);
    const firstPnpm = commands.findIndex(command => /(^|\n)pnpm /.test(command));
    expect(corepack).toBeLessThan(firstPnpm);
    expect(workflow.text).not.toMatch(/npm install --global|npx /);
    expect(commands).toContain('pnpm install --frozen-lockfile');
  });

  it('audits the web client dependencies right after their frozen installation and before the type check', () => {
    const install = commands.lastIndexOf('pnpm install --frozen-lockfile');
    const audit = stepNamed(checkSteps, 'Audit dependencies');
    expect(runOf(audit)).toBe('pnpm audit --audit-level high');
    expect(scalar(audit, 'working-directory', 8)).toBe('workspace/ambrogio-web');
    expect(checkSteps.indexOf(audit)).toBe(install + 1);
    expect(checkSteps.indexOf(audit)).toBeLessThan(position('pnpm typecheck'));
    expect(scalar(checkSteps[install] ?? '', 'working-directory', 8)).toBe('workspace/ambrogio-web');
    expect(workflow.text).not.toMatch(/--ignore|--prod\b|--dev\b/);
  });

  it('accepts audit exceptions only as single GHSA identifiers', () => {
    const config = readRepositoryFile('pnpm-workspace.yaml');
    const audit = block(config, 'auditConfig');
    const lines = audit.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 0) {
      expect(lines[0]?.trim()).toBe('ignoreGhsas:');
      for (const line of lines.slice(1)) expect(line).toMatch(/^ {4}- GHSA(-[23456789cfghjmpqrvwx]{4}){3}$/);
    }
  });

  it('installs gitleaks exactly as the secret scan workflow does, before the tests', () => {
    const scan = readWorkflow('secret-scan.yml');
    const scanJob = job(scan, 'gitleaks');
    for (const name of ['GITLEAKS_VERSION', 'GITLEAKS_SHA256']) {
      expect(scalar(block(checks, 'env', 4), name, 6), name).toBe(scalar(block(scanJob, 'env', 4), name, 6));
    }
    const install = stepNamed(checkSteps, 'Install gitleaks');
    expect(runOf(install)).toBe(runOf(stepNamed(steps(scanJob), 'Install gitleaks')));
    expect(scalar(install, 'shell', 8)).toBe('bash');
    expect(checkSteps.indexOf(install)).toBeLessThan(position('pnpm test'));
  });

  it('checks out the web client, ambrogio-model and the other repositories side by side in workspace/', () => {
    const checkout = stepNamed(checkSteps, 'Check out repository');
    expect(checkout).toMatch(/uses: actions\/checkout@/);
    expect(scalar(block(checkout, 'with', 8), 'path', 10)).toBe('workspace/ambrogio-web');
    expect(scalar(block(checkout, 'with', 8), 'fetch-depth', 10)).toBe('0');
    expect(scalar(block(checks, 'env', 4), 'BRANCH', 6)).toBe('${{ github.head_ref || github.ref_name }}');
    const model = runOf(stepNamed(checkSteps, 'Check out ambrogio-model'));
    expect(model).toContain('url="https://github.com/ambrogio-app/ambrogio-model.git"');
    expect(model).toContain('if git ls-remote --exit-code --heads "$url" "$BRANCH" >/dev/null; then ref="$BRANCH"; fi');
    expect(model).toContain('git clone --quiet --branch "$ref" "$url" workspace/ambrogio-model');
    expect(position('ambrogio-model.git'))
      .toBeLessThan(position('workspace/ambrogio-model/scripts/checkout-workspace workspace "$BRANCH"'));
  });

  it('runs the model, type, test, build and integration checks in the contract order', () => {
    const order = [
      'workspace/ambrogio-model/scripts/checkout-workspace workspace "$BRANCH"',
      'workspace/ambrogio-model/scripts/model-checks --workspace workspace',
      'corepack enable',
      'pnpm audit --audit-level high',
      'pnpm typecheck',
      'pnpm test',
      'pnpm build',
      'pnpm test:backend',
    ].map(position);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(new Set(order).size).toBe(order.length);
    expect(position('pnpm install --frozen-lockfile')).toBeLessThan(position('pnpm typecheck'));
    expect(commands.slice(-2)).toEqual(['pnpm build', 'pnpm test:backend']);
  });

  it('leaves the Reqvire version and the model integrity checks to ambrogio-model', () => {
    expect(workflow.text).not.toMatch(/reqvire@\d|check-model/);
  });

  it('installs and builds the side-by-side backend in its folder, where Corepack uses the pnpm version it declares', () => {
    const backend = stepNamed(checkSteps, 'Install and build the side-by-side backend');
    expect(scalar(backend, 'working-directory', 8)).toBe('workspace/ambrogio-backend');
    expect(runOf(backend).split('\n').slice(-2)).toEqual(['pnpm install --frozen-lockfile', 'pnpm build']);
    expect(checkSteps.indexOf(backend)).toBeGreaterThan(checkSteps.indexOf(stepNamed(checkSteps, 'Enable Corepack')));
  });

  it('runs the web client commands in its checkout', () => {
    for (const command of ['pnpm audit --audit-level high', 'pnpm typecheck', 'pnpm test', 'pnpm build', 'pnpm test:backend']) {
      expect(scalar(checkSteps[position(command)] ?? '', 'working-directory', 8), command).toBe('workspace/ambrogio-web');
    }
  });

  it('lets every failed check fail the job', () => {
    expect(workflow.text).not.toMatch(/continue-on-error|\|\|\s*true/);
    expect(checkSteps.filter(step => scalar(step, 'if', 8) !== undefined)).toEqual([]);
    for (const step of checkSteps.filter(text => scalar(text, 'run', 8) === '|')) {
      expect(scalar(step, 'shell', 8)).toBe('bash');
      expect(runOf(step).split('\n')[0]).toBe('set -euo pipefail');
    }
  });
});
