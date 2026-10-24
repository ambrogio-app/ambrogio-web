import { describe, expect, it } from 'vitest';
import { job, readRepositoryFile, readWorkflow, runOf, scalar, steps } from '../support/repository-files';

const packageJson = JSON.parse(readRepositoryFile('package.json')) as { scripts: Record<string, string> };
const checkSteps = steps(job(readWorkflow('ci.yml'), 'checks'));

/** The pnpm commands that the CI job runs in the web client checkout after the dependency audit. */
function ciChecksAfterAudit(): string[] {
  const web = checkSteps.filter(step => scalar(step, 'working-directory', 8) === 'workspace/ambrogio-web')
    .map(runOf).filter(command => command.startsWith('pnpm '));
  const audit = web.indexOf('pnpm audit --audit-level high');
  expect(audit).toBeGreaterThan(0);
  return web.slice(audit + 1);
}

describe('complete verification command', () => {
  it('runs the model checks, the frozen installation, the audit, the side-by-side backend and the CI checks in order', () => {
    const checks = ciChecksAfterAudit();
    expect(checks).toEqual(['pnpm typecheck', 'pnpm test', 'pnpm build', 'pnpm test:backend']);
    expect(packageJson.scripts.verify?.split(' && ')).toEqual([
      '../ambrogio-model/scripts/model-checks',
      'pnpm install --frozen-lockfile',
      'pnpm audit --audit-level high',
      '(cd ../ambrogio-backend',
      'pnpm install --frozen-lockfile',
      'pnpm build)',
      ...checks,
    ]);
  });

  it('is named in the agent instructions', () => {
    expect(readRepositoryFile('AGENTS.md')).toContain('`pnpm verify`');
  });
});
