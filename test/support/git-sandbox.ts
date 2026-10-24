import { spawnSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type CommandResult = { readonly status: number | null; readonly output: string };

/** Absolute path of a program on the PATH, or undefined. */
export function which(program: string): string | undefined {
  const result = spawnSync('sh', ['-c', `command -v ${program}`], { encoding: 'utf8' });
  const path = result.stdout.trim();
  return result.status === 0 && path.startsWith('/') ? path : undefined;
}

/** Fails with an explanation when gitleaks, which the tests run, is missing. */
export function requireGitleaks(): string {
  const path = which('gitleaks');
  if (path === undefined) {
    throw new Error('gitleaks not found on PATH: install gitleaks 8.30.1 as described in AGENTS.md');
  }
  return path;
}

/**
 * A GitHub personal access token shape that gitleaks recognises, built at run time so that the
 * repository never contains a token-like literal.
 */
export function fakeGitHubToken(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return ['g', 'h', 'p', '_'].join('') + Array.from({ length: 36 }, () => alphabet[randomInt(alphabet.length)]).join('');
}

/**
 * A temporary Git repository isolated from the global and system Git configuration. The repository is
 * `repository/` inside a temporary folder, so that tests can place sibling folders next to it.
 */
export class GitSandbox {
  readonly root = mkdtempSync(join(tmpdir(), 'ambrogio-web-git-'));
  readonly directory = join(this.root, 'repository');
  private readonly env: NodeJS.ProcessEnv = {
    ...process.env,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_TERMINAL_PROMPT: '0',
  };

  constructor() {
    mkdirSync(this.directory);
    for (const args of [
      ['init', '--quiet', '--initial-branch=main'],
      ['config', 'user.name', 'Test Author'],
      ['config', 'user.email', 'author@example.com'],
      ['config', 'commit.gpgsign', 'false'],
    ]) this.mustRun('git', args);
  }

  write(path: string, content: string): void {
    writeFileSync(join(this.directory, path), content);
  }

  run(program: string, args: readonly string[], env: NodeJS.ProcessEnv = {}): CommandResult {
    const result = spawnSync(program, args, { cwd: this.directory, encoding: 'utf8', env: { ...this.env, ...env } });
    if (result.error !== undefined) throw result.error;
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  }

  mustRun(program: string, args: readonly string[]): string {
    const result = this.run(program, args);
    if (result.status !== 0) throw new Error(`${program} ${args.join(' ')} failed: ${result.output}`);
    return result.output;
  }

  commitCount(): number {
    const result = this.run('git', ['rev-list', '--count', 'HEAD']);
    return result.status === 0 ? Number(result.output.trim()) : 0;
  }

  remove(): void {
    rmSync(this.root, { recursive: true, force: true });
  }
}
