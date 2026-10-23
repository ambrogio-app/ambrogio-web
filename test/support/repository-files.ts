import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Absolute path of the repository root. */
export const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

export function readRepositoryFile(path: string): string {
  return readFileSync(new URL(path, `file://${repositoryRoot}`), 'utf8');
}

/** Text of a contract of the Reqvire model, from its heading to the element separator. */
export function contractText(title: string): string {
  const model = readRepositoryFile('system-model/Contracts/WebConversation.md');
  const start = model.indexOf(`### ${title}\n`);
  if (start < 0) throw new Error(`contract not found: ${title}`);
  const end = model.indexOf('\n---', start);
  return model.slice(start, end < 0 ? undefined : end);
}

/** The first group of `pattern` in `text`; fails when the pattern does not match. */
export function capture(text: string, pattern: RegExp): string {
  const match = pattern.exec(text);
  if (match?.[1] === undefined) throw new Error(`pattern not found: ${pattern}`);
  return match[1];
}

// Workflows are read as plain text: these helpers only split the YAML into blocks by indentation,
// which is enough for the fixed layout of the repository workflows.

const indentOf = (line: string): number => line.length - line.trimStart().length;
const significant = (line: string): boolean => line.trim() !== '' && !line.trimStart().startsWith('#');

/** The lines nested under `key:` at the given indentation, without the key line. */
export function block(text: string, key: string, indent = 0): string {
  const lines = text.split('\n');
  const start = lines.findIndex(line => indentOf(line) === indent && line.trim().startsWith(`${key}:`)
    && significant(line));
  if (start < 0) return '';
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (significant(line) && indentOf(line) <= indent) break;
    body.push(line);
  }
  return body.join('\n');
}

/** The value written on the same line as `key:` at the given indentation. */
export function scalar(text: string, key: string, indent = 0): string | undefined {
  const line = text.split('\n').find(candidate => indentOf(candidate) === indent
    && candidate.trim().startsWith(`${key}:`) && significant(candidate));
  return line?.trim().slice(key.length + 1).trim();
}

/** Keys of a mapping block, at the indentation of its first significant line. */
export function keys(mapping: string): string[] {
  const lines = mapping.split('\n').filter(significant);
  const first = lines[0];
  if (first === undefined) return [];
  const indent = indentOf(first);
  return lines.filter(line => indentOf(line) === indent).map(line => line.trim().split(':')[0] ?? '');
}

export type Workflow = { readonly text: string; readonly jobs: ReadonlyMap<string, string> };

export function readWorkflow(name: string): Workflow {
  const text = readRepositoryFile(`.github/workflows/${name}`);
  const jobsBlock = block(text, 'jobs');
  const jobs = new Map(keys(jobsBlock).map(id => [id, block(jobsBlock, id, 2)]));
  return { text, jobs };
}

export function job(workflow: Workflow, id: string): string {
  const text = workflow.jobs.get(id);
  if (text === undefined) throw new Error(`job not found: ${id}`);
  return text;
}

/** The steps of a job, each as the text of its list item. */
export function steps(jobText: string): string[] {
  const list = block(jobText, 'steps', 4);
  const items: string[] = [];
  for (const line of list.split('\n')) {
    if (/^ {6}- /.test(line)) items.push(line);
    else if (items.length > 0) items[items.length - 1] += `\n${line}`;
  }
  return items;
}

export function stepNamed(stepTexts: readonly string[], name: string): string {
  const step = stepTexts.find(text => text.startsWith(`      - name: ${name}\n`));
  if (step === undefined) throw new Error(`step not found: ${name}`);
  return step;
}

/** The commands of a step: a one-line `run:` value or the lines of a `run: |` block. */
export function runOf(stepText: string): string {
  const value = scalar(stepText, 'run', 8);
  if (value === undefined) return '';
  if (value !== '|') return value;
  return block(stepText, 'run', 8).split('\n').map(line => line.slice(10)).join('\n').trim();
}
