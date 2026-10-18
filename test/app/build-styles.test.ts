import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'vite';

// The page styles must survive the production build: a side-effect import of a CSS module was
// dropped by Vite, leaving the page without theme, fonts and the full-height layout.
describe('production build styles', () => {
  let outDir: string;
  let css: string;

  beforeAll(async () => {
    outDir = await mkdtemp(join(tmpdir(), 'ambrogio-web-build-'));
    await build({ logLevel: 'silent', build: { outDir, emptyOutDir: true } });
    const assets = join(outDir, 'assets');
    const files = (await readdir(assets)).filter((name) => name.endsWith('.css'));
    css = (await Promise.all(files.map((name) => readFile(join(assets, name), 'utf8')))).join('\n');
  }, 60_000);

  afterAll(async () => { await rm(outDir, { recursive: true, force: true }); });

  it('keeps the theme colours for light and dark mode', () => {
    expect(css).toMatch(/:root\{[^}]*--background:#fff/);
    expect(css).toMatch(/prefers-color-scheme:\s*dark|--lightningcss-dark/);
    expect(css).toContain('--accent');
  });

  it('keeps the full-height page so the sidebar and the chat scroll on their own', () => {
    expect(css).toMatch(/html,\s*body,\s*#root\{[^}]*height:100%/);
    expect(css).toMatch(/font-family:system-ui/);
  });
});
