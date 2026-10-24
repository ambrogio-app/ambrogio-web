import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fakeGitHubToken, GitSandbox, requireGitleaks, which } from '../support/git-sandbox';
import { commonContractText, readRepositoryFile } from '../support/repository-files';

describe('pre-commit hook', () => {
  let sandbox: GitSandbox;
  let invoked: string;

  /** A fake `model-checks` of a sibling `ambrogio-model`: it records its run and passes or fails. */
  function siblingModelChecks(passes: boolean): void {
    const scripts = join(sandbox.root, 'ambrogio-model', 'scripts');
    mkdirSync(scripts, { recursive: true });
    const script = join(scripts, 'model-checks');
    writeFileSync(script, [
      '#!/bin/sh',
      `echo invoked > '${invoked}'`,
      ...(passes ? ['exit 0'] : ['echo "model-checks: fake model violation" >&2', 'exit 1']),
      '',
    ].join('\n'));
    chmodSync(script, 0o755);
  }

  function commitNotes() {
    sandbox.write('notes.txt', 'Nothing secret here.\n');
    sandbox.mustRun('git', ['add', 'notes.txt']);
    return sandbox.run('git', ['commit', '--quiet', '-m', 'Add notes']);
  }

  beforeEach(() => {
    requireGitleaks();
    sandbox = new GitSandbox();
    invoked = join(sandbox.root, 'model-checks-invoked');
    mkdirSync(join(sandbox.directory, '.githooks'));
    sandbox.write('.githooks/pre-commit', readRepositoryFile('.githooks/pre-commit'));
    chmodSync(join(sandbox.directory, '.githooks/pre-commit'), 0o755);
    sandbox.mustRun('git', ['config', 'core.hooksPath', '.githooks']);
  });

  afterEach(() => {
    const directory = sandbox.root;
    sandbox.remove();
    expect(existsSync(directory)).toBe(false);
  });

  it('blocks a commit that adds a secret without printing its value or running the model checks', () => {
    siblingModelChecks(true);
    const token = fakeGitHubToken();
    sandbox.write('settings.txt', `github_token = "${token}"\n`);
    sandbox.mustRun('git', ['add', 'settings.txt']);

    const result = sandbox.run('git', ['commit', '--quiet', '-m', 'Add settings']);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('leaks found: 1');
    expect(result.output).not.toContain(token);
    expect(result.output).not.toContain(token.slice(4));
    expect(sandbox.commitCount()).toBe(0);
    expect(existsSync(invoked)).toBe(false);
  });

  it('lets a commit without secrets through when the model checks of the sibling ambrogio-model pass', () => {
    siblingModelChecks(true);

    const result = commitNotes();

    expect(result.status).toBe(0);
    expect(sandbox.commitCount()).toBe(1);
    expect(existsSync(invoked)).toBe(true);
  });

  it('blocks the commit when the model checks fail', () => {
    siblingModelChecks(false);

    const result = commitNotes();

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('model-checks: fake model violation');
    expect(sandbox.commitCount()).toBe(0);
    expect(existsSync(invoked)).toBe(true);
  });

  it('blocks the commit with the contract message when ambrogio-model is not next to the repository', () => {
    const message = /`(pre-commit: ambrogio-model is not next to this repository;[^`]*)`/
      .exec(commonContractText("Controlli del modello nell'hook pre-commit"))?.[1];
    expect(message).toBeDefined();

    const result = commitNotes();

    expect(result.status).not.toBe(0);
    expect(result.output).toContain(message);
    expect(sandbox.commitCount()).toBe(0);
  });

  it('blocks the commit and explains how to install gitleaks when it is not on PATH', () => {
    siblingModelChecks(true);
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
      expect(existsSync(invoked)).toBe(false);
    } finally {
      rmSync(bin, { recursive: true, force: true });
    }
  });
});
