import { describe, expect, it } from 'vitest';
import { capture, contractText, readRepositoryFile } from '../support/repository-files';

type PackageJson = {
  packageManager: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  engines: { node: string };
};

const packageJson = JSON.parse(readRepositoryFile('package.json')) as PackageJson;
const all = { ...packageJson.dependencies, ...packageJson.devDependencies };
const stack = contractText('Stack e build del client web');
const installation = contractText('Profilo di installazione delle dipendenze del client web');
const dockerfile = readRepositoryFile('Dockerfile');

describe('pinned stack versions', () => {
  it('pins every dependency to an exact version', () => {
    const loose = Object.entries(all).filter(([, version]) => !/^\d+\.\d+\.\d+$/.test(version));
    expect(Object.keys(all).length).toBeGreaterThan(0);
    expect(loose).toEqual([]);
  });

  it('uses the TypeScript and Vitest versions of the stack contract', () => {
    expect(all.typescript).toBe(capture(stack, /TypeScript (\d+\.\d+\.\d+)/));
    expect(all.vitest).toBe(capture(stack, /Vitest (\d+\.\d+\.\d+)/));
  });

  it('uses the React major version of the stack contract with the Markdown renderer and Vite', () => {
    const major = capture(stack, /React (\d+)\b/);
    expect(packageJson.dependencies.react?.split('.')[0]).toBe(major);
    expect(packageJson.dependencies['react-dom']?.split('.')[0]).toBe(major);
    expect(Object.keys(packageJson.dependencies)).toEqual(expect.arrayContaining(['react-markdown', 'remark-gfm']));
    expect(stack).toContain('`react-markdown` e `remark-gfm`');
    expect(packageJson.devDependencies.vite).toBeDefined();
  });

  it('declares the pnpm version of the installation profile', () => {
    expect(packageJson.packageManager).toBe(`pnpm@${capture(installation, /pnpm (\d+\.\d+\.\d+)/)}`);
  });

  it('requires the Node.js version of the contract, also in the image build stage', () => {
    const node = capture(stack, /Node\.js (\d+)\b/);
    expect(packageJson.engines.node).toBe(`>=${node}`);
    expect(dockerfile).toMatch(new RegExp(`^FROM --platform=\\$BUILDPLATFORM node:${node} AS build$`, 'm'));
  });

  it('compiles TypeScript in strict mode', () => {
    const tsconfig = JSON.parse(readRepositoryFile('tsconfig.json')) as { compilerOptions: { strict?: boolean } };
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('builds static files with Vite into dist', () => {
    expect(packageJson.scripts.build).toBe('vite build');
    expect(readRepositoryFile('vite.config.ts')).toMatch(/build: \{[^}]*outDir: 'dist'/);
  });

  it('serves only the static files and the nginx configuration, without a server process of its own', () => {
    const stages = dockerfile.split(/^(?=FROM )/m);
    const runtime = stages[stages.length - 1] ?? '';
    expect(runtime).toMatch(/^FROM nginxinc\/nginx-unprivileged:/);
    const copies = runtime.split('\n').filter(line => line.startsWith('COPY'));
    expect(copies).toEqual([
      'COPY nginx/default.conf /etc/nginx/conf.d/default.conf',
      'COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf',
      'COPY --from=build /app/dist /usr/share/nginx/html',
    ]);
    expect(runtime).not.toMatch(/^(CMD|ENTRYPOINT)\b/m);
  });
});
