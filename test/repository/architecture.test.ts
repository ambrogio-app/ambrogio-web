import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { repositoryRoot } from '../support/repository-files';
import { scan, specifiers, type Scanned } from '../support/source-imports';

// Browser globals that the core never names: src/app/ provides the browser APIs as dependencies.
// fetch, history and location are left to the architecture analysis, because telling them apart
// from project properties and methods with the same name needs the type checker.
const browserGlobal = /(?<![\w$.])(?:document|window|navigator|localStorage|sessionStorage|crypto)(?![\w$])(?!\s*\??:)/g;
const webSocketConstruction = /\bnew\s+WebSocket\b/g;
const reactPackage = /^react(?:$|[-/])/;

function browserGlobalsIn({ code }: Scanned): string[] {
  return [...code.matchAll(browserGlobal), ...code.matchAll(webSocketConstruction)].map(match => match[0]);
}

type ProductionFile = {
  readonly path: string; // relative to the repository, with forward slashes
  readonly scanned: Scanned;
  readonly imports: readonly string[]; // relative imports resolved to repository paths, packages as written
};

const toRepositoryPath = (absolute: string): string => relative(repositoryRoot, absolute).split(sep).join('/');
const featureOf = (path: string): string | undefined => /^src\/features\/([^/]+)\//.exec(path)?.[1];
const isCore = (path: string): boolean => /^src\/features\/[^/]+\/model\//.test(path)
  || (path.startsWith('src/shared/') && !path.startsWith('src/shared/ui/'));

function filesUnder(directory: string): string[] {
  return readdirSync(join(repositoryRoot, directory), { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => toRepositoryPath(join(entry.parentPath, entry.name)));
}

function directoriesUnder(directory: string): string[] {
  return readdirSync(join(repositoryRoot, directory), { recursive: true, withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => toRepositoryPath(join(entry.parentPath, entry.name)));
}

describe('textual import extraction', () => {
  const sample = scan(readFileSync(join(repositoryRoot, 'test/repository/fixtures/import-sample.txt'), 'utf8'));

  it('finds exactly the import and export specifiers of the sample file', () => {
    expect(specifiers(sample)).toEqual([
      'react', '../../../shared/result', './multi-line', './namespace', './side-effect.css',
      './re-export', './star-export', './type-export', './dynamic',
    ]);
  });

  it('finds browser globals outside comments, strings and object keys of the sample file', () => {
    expect(browserGlobalsIn(sample)).toEqual(['window']);
  });
});

describe('architecture rules of the web client', () => {
  let files: ProductionFile[];

  beforeAll(() => {
    files = filesUnder('src').filter(path => /\.tsx?$/.test(path)).map(path => {
      const scanned = scan(readFileSync(join(repositoryRoot, path), 'utf8'));
      const imports = specifiers(scanned).map(specifier => specifier.startsWith('.')
        ? toRepositoryPath(resolve(dirname(join(repositoryRoot, path)), specifier))
        : specifier);
      return { path, scanned, imports };
    });
  });

  it('reads every TypeScript production file of src/ and finds its imports', () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files.filter(file => file.path.startsWith('src/app/')).every(file => file.imports.length > 0)).toBe(true);
  });

  it('keeps the core free of React, of ui/ parts and of src/app/', () => {
    const violations = files.filter(file => isCore(file.path)).flatMap(file => [
      ...(file.path.endsWith('.ts') ? [] : [`${file.path}: core file is not a .ts file`]),
      ...file.imports
        .filter(target => reactPackage.test(target) || /(^|\/)ui(\/|$)/.test(target) || target.startsWith('src/app/'))
        .map(target => `${file.path} imports ${target}`),
    ]);
    expect(violations).toEqual([]);
  });

  it('keeps the core from naming browser globals, which src/app/ provides as dependencies', () => {
    const violations = files.filter(file => isCore(file.path))
      .flatMap(file => browserGlobalsIn(file.scanned).map(name => `${file.path} uses ${name}`));
    expect(violations).toEqual([]);
  });

  it('keeps every feature from importing another feature', () => {
    const violations = files.flatMap(file => {
      const own = featureOf(file.path);
      if (own === undefined) return [];
      return file.imports.filter(target => {
        const other = featureOf(target);
        return other !== undefined && other !== own;
      }).map(target => `${file.path} imports ${target}`);
    });
    expect(violations).toEqual([]);
  });

  it('lets only src/app/ import more than one feature', () => {
    const violations = files.filter(file => !file.path.startsWith('src/app/')).flatMap(file => {
      const features = new Set(file.imports.map(featureOf).filter(feature => feature !== undefined));
      const own = featureOf(file.path);
      if (own !== undefined) features.add(own);
      return features.size > 1 ? [`${file.path} links ${[...features].join(', ')}`] : [];
    });
    expect(violations).toEqual([]);
  });

  it('names non-React files in kebab-case and components in PascalCase', () => {
    const violations = files.flatMap(file => {
      const name = basename(file.path);
      if (file.path === 'src/app/main.tsx') return [];
      const valid = name.endsWith('.tsx') ? /^[A-Z][A-Za-z0-9]*\.tsx$/.test(name) : /^[a-z0-9]+(?:-[a-z0-9]+)*\.ts$/.test(name);
      return valid ? [] : [file.path];
    });
    expect(violations).toEqual([]);
  });

  it('names test files <name>.test.ts or <name>.test.tsx', () => {
    const violations = filesUnder('test').filter(path => /\.test\./.test(path))
      .filter(path => !/^[a-z0-9]+(?:-[a-z0-9]+)*\.test\.ts$|^[A-Za-z0-9]+(?:-[a-z0-9]+)*\.test\.tsx$/.test(basename(path)));
    expect(violations).toEqual([]);
  });

  it('mirrors the structure of src/ in test/', () => {
    const sources = new Set(directoriesUnder('src').map(path => path.replace(/^src\//, '')));
    const violations = directoriesUnder('test').map(path => path.replace(/^test\//, ''))
      .filter(path => !/^(support|repository)(\/|$)/.test(path) && !sources.has(path));
    expect(violations).toEqual([]);
  });
});
