import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fakeGitHubToken, GitSandbox, requireGitleaks, which } from '../support/git-sandbox';
import { commonContractText, readRepositoryFile } from '../support/repository-files';

describe('pre-commit hook', () => {
  let sandbox: GitSandbox;
  let invoked: string;

  /** A fake `model-checks` of a sibling `ambrogio-model`: it records its arguments, one per line, and passes or fails. */
  function siblingModelChecks(passes: boolean): void {
    const scripts = join(sandbox.root, 'ambrogio-model', 'scripts');
    mkdirSync(scripts, { recursive: true });
    const script = join(scripts, 'model-checks');
    writeFileSync(script, [
      '#!/bin/sh',
      `printf '%s\\n' "$@" > '${invoked}'`,
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

  it('blocks a secret even when an inline gitleaks:allow comment follows it', () => {
    siblingModelChecks(true);
    const token = fakeGitHubToken();
    sandbox.write('settings.txt', `github_token = "${token}" # gitleaks:allow\n`);
    sandbox.mustRun('git', ['add', 'settings.txt']);

    const result = sandbox.run('git', ['commit', '--quiet', '-m', 'Add settings']);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('leaks found: 1');
    expect(result.output).not.toContain(token);
    expect(sandbox.commitCount()).toBe(0);
    expect(existsSync(invoked)).toBe(false);
  });

  it('lets a commit without secrets through when the model checks of the sibling ambrogio-model pass on the staged content', () => {
    siblingModelChecks(true);

    const result = commitNotes();

    expect(result.status).toBe(0);
    expect(sandbox.commitCount()).toBe(1);
    expect(existsSync(invoked)).toBe(true);
    const [mode, top, index] = readFileSync(invoked, 'utf8').split('\n').filter(Boolean);
    const root = realpathSync(sandbox.directory);
    expect(mode).toBe('--staged');
    expect(top).toBe(root);
    expect(index !== undefined && isAbsolute(index)).toBe(true);
    expect(index?.startsWith(join(root, '.git', 'index'))).toBe(true);
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

  /**
   * Tries a clean commit with a PATH holding only git and, when `version` is given, a fake gitleaks that
   * prints that version; returns the result.
   */
  function commitWithout8301(version?: string) {
    siblingModelChecks(true);
    const git = which('git');
    if (git === undefined) throw new Error('git not found on PATH');
    const bin = mkdtempSync(join(tmpdir(), 'ambrogio-web-bin-'));
    try {
      symlinkSync(git, join(bin, 'git'));
      if (version !== undefined) {
        writeFileSync(join(bin, 'gitleaks'), `#!/bin/sh\n[ "$1" = version ] && echo '${version}'\nexit 0\n`);
        chmodSync(join(bin, 'gitleaks'), 0o755);
      }
      sandbox.write('notes.txt', 'Nothing secret here.\n');
      sandbox.mustRun('git', ['add', 'notes.txt']);
      return sandbox.run(join(bin, 'git'), ['commit', '--quiet', '-m', 'Add notes'], { PATH: bin });
    } finally {
      rmSync(bin, { recursive: true, force: true });
    }
  }

  const gitleaksMessage = 'pre-commit: gitleaks 8.30.1 is not on PATH; install gitleaks 8.30.1 '
    + '(https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1) and retry.';

  it.each([
    ['is not on PATH', undefined],
    ['on PATH is not version 8.30.1', '8.29.0'],
  ])('blocks the commit and explains how to install gitleaks 8.30.1 when gitleaks %s', (_case, version) => {
    const result = commitWithout8301(version);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain(gitleaksMessage);
    expect(sandbox.commitCount()).toBe(0);
    expect(existsSync(invoked)).toBe(false);
  });
});
