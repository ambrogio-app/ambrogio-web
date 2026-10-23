import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fakeGitHubToken, GitSandbox, requireGitleaks, which } from '../support/git-sandbox';
import { readRepositoryFile } from '../support/repository-files';

describe('pre-commit secret hook', () => {
  let sandbox: GitSandbox;

  beforeEach(() => {
    requireGitleaks();
    sandbox = new GitSandbox();
    mkdirSync(join(sandbox.directory, '.githooks'));
    sandbox.write('.githooks/pre-commit', readRepositoryFile('.githooks/pre-commit'));
    chmodSync(join(sandbox.directory, '.githooks/pre-commit'), 0o755);
    sandbox.mustRun('git', ['config', 'core.hooksPath', '.githooks']);
  });

  afterEach(() => {
    const directory = sandbox.directory;
    sandbox.remove();
    expect(existsSync(directory)).toBe(false);
  });

  it('blocks a commit that adds a secret without printing its value', () => {
    const token = fakeGitHubToken();
    sandbox.write('settings.txt', `github_token = "${token}"\n`);
    sandbox.mustRun('git', ['add', 'settings.txt']);

    const result = sandbox.run('git', ['commit', '--quiet', '-m', 'Add settings']);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('leaks found: 1');
    expect(result.output).not.toContain(token);
    expect(result.output).not.toContain(token.slice(4));
    expect(sandbox.commitCount()).toBe(0);
  });

  it('lets a commit without secrets through', () => {
    sandbox.write('notes.txt', 'Nothing secret here.\n');
    sandbox.mustRun('git', ['add', 'notes.txt']);

    const result = sandbox.run('git', ['commit', '--quiet', '-m', 'Add notes']);

    expect(result.status).toBe(0);
    expect(sandbox.commitCount()).toBe(1);
  });

  it('blocks the commit and explains how to install gitleaks when it is not on PATH', () => {
    const git = which('git');
    if (git === undefined) throw new Error('git not found on PATH');
    const bin = mkdtempSync(join(tmpdir(), 'ambrogio-web-bin-'));
    try {
      symlinkSync(git, join(bin, 'git'));
      sandbox.write('notes.txt', 'Nothing secret here.\n');
      sandbox.mustRun('git', ['add', 'notes.txt']);

      const result = sandbox.run(join(bin, 'git'), ['commit', '--quiet', '-m', 'Add notes'], { PATH: bin });

      expect(result.status).not.toBe(0);
      expect(result.output).toContain('gitleaks not found on PATH; commit blocked.');
      expect(result.output).toContain('Install gitleaks 8.30.1 from https://github.com/gitleaks/gitleaks/releases');
      expect(sandbox.commitCount()).toBe(0);
    } finally {
      rmSync(bin, { recursive: true, force: true });
    }
  });
});
