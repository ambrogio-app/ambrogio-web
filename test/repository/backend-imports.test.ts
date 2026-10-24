import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { repositoryRoot } from '../support/repository-files';
import { scan, specifiers } from '../support/source-imports';

const toRepositoryPath = (absolute: string): string => relative(repositoryRoot, absolute).split(sep).join('/');

/** Why `specifier`, written in the repository file `path`, reaches backend code; undefined when it does not. */
function backendImport(path: string, specifier: string): string | undefined {
  if (specifier.startsWith('@ambrogio/')) return 'names a package of the @ambrogio scope of the backend';
  if (specifier.includes('ambrogio-backend')) return 'names the ambrogio-backend repository';
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    const target = toRepositoryPath(resolve(dirname(join(repositoryRoot, path)), specifier));
    if (target === '..' || target.startsWith('../') || /^[a-zA-Z]:/.test(target)) return 'leaves the repository';
  }
  return undefined;
}

function violationsOf(path: string, source: string): string[] {
  return specifiers(scan(source)).flatMap(specifier => {
    const reason = backendImport(path, specifier);
    return reason === undefined ? [] : [`${path} imports ${specifier}: ${reason}`];
  });
}

describe('backend imports of the web client', () => {
  it('recognises the imports that reach backend code', () => {
    const source = [
      "import { a } from '@ambrogio/conversations/application/produce-conversation-reply';",
      "export * from '../../../ambrogio-backend/apps/server/src/runtime/test-server';",
      "import '../../../../../outside';",
      "const b = await import('ambrogio-backend');",
      "import { c } from 'react';",
      "import { d } from '../../shared/result';",
    ].join('\n');
    expect(violationsOf('src/features/chat/model/sample.ts', source)).toEqual([
      'src/features/chat/model/sample.ts imports @ambrogio/conversations/application/produce-conversation-reply: names a package of the @ambrogio scope of the backend',
      'src/features/chat/model/sample.ts imports ../../../ambrogio-backend/apps/server/src/runtime/test-server: names the ambrogio-backend repository',
      'src/features/chat/model/sample.ts imports ../../../../../outside: leaves the repository',
      'src/features/chat/model/sample.ts imports ambrogio-backend: names the ambrogio-backend repository',
    ]);
  });

  it('finds no backend import in any TypeScript production file of src/', () => {
    const files = readdirSync(join(repositoryRoot, 'src'), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && /\.tsx?$/.test(entry.name))
      .map(entry => toRepositoryPath(join(entry.parentPath, entry.name)));
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain('src/app/main.tsx');
    const read = files.map(path => ({ path, source: readFileSync(join(repositoryRoot, path), 'utf8') }));
    expect(read.filter(file => specifiers(scan(file.source)).length > 0).length).toBeGreaterThan(0);
    expect(read.flatMap(file => violationsOf(file.path, file.source))).toEqual([]);
  });
});
