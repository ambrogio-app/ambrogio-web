import { readdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { SyntaxKind, type Node, type SourceFile } from 'typescript/unstable/ast';
import { API, type Project } from 'typescript/unstable/sync';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { repositoryRoot } from '../support/repository-files';

// Browser globals that the core receives as dependencies from src/app/ instead of using directly.
const browserGlobals = new Set(['document', 'window', 'navigator', 'localStorage', 'sessionStorage',
  'location', 'history', 'fetch', 'WebSocket', 'crypto']);
const reactPackage = /^react(?:$|[-/])/;

type ProductionFile = {
  readonly path: string; // relative to the repository, with forward slashes
  readonly source: SourceFile;
  readonly imports: readonly string[]; // relative imports resolved to repository paths, packages as written
};

const textOf = (node: Node): string => (node as Node & { text: string }).text;
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

describe('architecture rules of the web client', () => {
  let api: API;
  let project: Project;
  let files: ProductionFile[];

  beforeAll(() => {
    api = new API({ cwd: repositoryRoot });
    const snapshot = api.updateSnapshot({ openProjects: [join(repositoryRoot, 'tsconfig.json')] });
    const loaded = snapshot.getProject(join(repositoryRoot, 'tsconfig.json'));
    if (loaded === undefined) throw new Error('tsconfig.json project not loaded');
    project = loaded;
    files = project.program.getSourceFileNames()
      .filter(name => toRepositoryPath(name).startsWith('src/'))
      .map(name => {
        const source = project.program.getSourceFile(name);
        if (source === undefined) throw new Error(`source file not loaded: ${name}`);
        const imports = source.imports.map(textOf).map(specifier => specifier.startsWith('.')
          ? toRepositoryPath(resolve(dirname(name), specifier))
          : specifier);
        return { path: toRepositoryPath(name), source, imports };
      });
  }, 60_000);

  afterAll(() => { api?.close(); });

  it('analyses every TypeScript production file of src/', () => {
    const onDisk = filesUnder('src').filter(path => /\.tsx?$/.test(path)).sort();
    expect(onDisk.length).toBeGreaterThan(0);
    expect(files.map(file => file.path).sort()).toEqual(onDisk);
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

  it('keeps the core from using browser globals, which src/app/ provides as dependencies', () => {
    const violations: string[] = [];
    for (const file of files.filter(candidate => isCore(candidate.path))) {
      const identifiers: Node[] = [];
      const visit = (node: Node): void => {
        if (node.kind === SyntaxKind.Identifier && browserGlobals.has(textOf(node))
          && node.parent.kind !== SyntaxKind.TypeReference) identifiers.push(node);
        node.forEachChild(visit);
      };
      visit(file.source);
      if (identifiers.length === 0) continue;
      const symbols = project.checker.getSymbolAtLocation(identifiers);
      identifiers.forEach((identifier, index) => {
        const declarations = symbols[index]?.declarations ?? [];
        // A browser global is declared only by the libraries, never by the project's own files.
        if (declarations.length > 0 && declarations.every(declaration => declaration.path.includes('/node_modules/'))) {
          violations.push(`${file.path} uses ${textOf(identifier)}`);
        }
      });
    }
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
