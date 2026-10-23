import { describe, expect, it } from 'vitest';
import { block, job, readWorkflow, runOf, scalar, stepNamed, steps } from '../support/repository-files';

const workflow = readWorkflow('ci.yml');
const checks = job(workflow, 'checks');
const checkSteps = steps(checks);
const commands = checkSteps.map(runOf);

/** Position of the step whose commands contain `fragment`; fails when no step does. */
function position(fragment: string): number {
  const index = commands.findIndex(command => command.includes(fragment));
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

  it('sets up Node.js 24, pnpm 12.11.2, gitleaks and the frozen dependencies', () => {
    const node = stepNamed(checkSteps, 'Set up Node.js');
    expect(node).toMatch(/uses: actions\/setup-node@/);
    expect(scalar(block(node, 'with', 8), 'node-version', 10)).toBe("'24'");
    expect(position('npm install --global pnpm@12.11.2')).toBeLessThan(position('pnpm install --frozen-lockfile'));
    expect(commands).toContain('pnpm install --frozen-lockfile');
  });

  it('installs gitleaks exactly as the secret scan workflow does, before the tests', () => {
    const scan = readWorkflow('secret-scan.yml');
    const scanJob = job(scan, 'gitleaks');
    expect(block(checks, 'env', 4)).toBe(block(scanJob, 'env', 4));
    const install = stepNamed(checkSteps, 'Install gitleaks');
    expect(runOf(install)).toBe(runOf(stepNamed(steps(scanJob), 'Install gitleaks')));
    expect(scalar(install, 'shell', 8)).toBe('bash');
    expect(checkSteps.indexOf(install)).toBeLessThan(position('pnpm test'));
  });

  it('runs the model, type, test and build checks in the contract order', () => {
    const order = [
      'npx --yes @reqvire-org/reqvire@1.3.2 --workspace "$PWD" validate',
      'npx --yes @reqvire-org/reqvire@1.3.2 --workspace "$PWD" lint --json > "$report"',
      'node scripts/check-model.mjs',
      'pnpm typecheck',
      'pnpm test',
      'pnpm build',
    ].map(position);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(new Set(order).size).toBe(order.length);
    expect(position('pnpm install --frozen-lockfile')).toBeLessThan(order[0] ?? -1);
    expect(commands.slice(-1)).toEqual(['pnpm build']);
  });

  it('fails the lint step when automatic fixes or items to review remain', () => {
    const lint = commands[position('lint --json')] ?? '';
    expect(lint).toContain("jq -e '.auto_fixable == [] and .needs_manual_review == []' \"$report\"");
    expect(lint.indexOf('cat "$report"')).toBeLessThan(lint.indexOf('jq -e'));
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
