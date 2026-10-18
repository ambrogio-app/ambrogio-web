import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket as NodeWebSocket } from 'ws';
import { ConversationsApi } from '../src/features/conversations/model/conversations-api';
import {
  ConversationSession, type SessionSocket,
} from '../src/features/session/model/conversation-session';

/** Backend revision declared in «Contratti pubblici del backend Ambrogio». */
const expectedCommit = 'a4578db6564cc0bb96397ae5655ee7d00e022ea0';
const allowedOrigin = 'https://web.example.com';
const otherOrigin = 'https://other.example.com';
const webRoot = fileURLToPath(new URL('..', import.meta.url));
const backendRoot = resolve(process.env.AMBROGIO_BACKEND_REPO ?? resolve(webRoot, '../ambrogio-backend'));

type Runtime = { close(): Promise<void> };
type ReplyPart = { kind: 'text'; text: string } | { kind: 'reply_expectation'; expectsReply: boolean };

let runtime: Runtime | undefined;
let directory: string;
let base: URL;
const neverReply = new Promise<never>(() => {});

async function freePort(): Promise<number> {
  const probe = createServer();
  await new Promise<void>(done => probe.listen(0, '127.0.0.1', done));
  const address = probe.address();
  if (!address || typeof address === 'string') throw new Error('No port');
  await new Promise(done => probe.close(done));
  return address.port;
}

function session(origin: string): ConversationSession {
  return new ConversationSession(base, {
    openSocket: (url, protocol) => {
      const socket = new NodeWebSocket(url, protocol, { origin });
      // A refused upgrade also closes the socket; the close event concludes the session opening.
      socket.on('error', () => {});
      return socket as unknown as SessionSocket;
    },
    identity: { clientId: 'web-00000000-0000-4000-8000-000000000001', name: 'Web verifica' },
    newId: () => crypto.randomUUID(),
  });
}

const api = () => new ConversationsApi(base, (url, init) => fetch(url, init));

async function until(check: () => Promise<boolean>, description: string): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (!(await check())) {
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${description}`);
    await new Promise(done => setTimeout(done, 25));
  }
}

beforeAll(async () => {
  const commit = execFileSync('git', ['-C', backendRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  expect(commit, 'the backend checkout must be at the revision declared in the model').toBe(expectedCommit);
  const { startConversationServer } = await import(
    pathToFileURL(join(backendRoot, 'apps/server/dist/runtime/conversation-server.js')).href);
  directory = await mkdtemp(join(tmpdir(), 'ambrogio-web-backend-'));
  const port = await freePort();
  const httpConfig = join(directory, 'http.json');
  const conversationsConfig = join(directory, 'conversations.json');
  await writeFile(httpConfig, JSON.stringify({ host: '127.0.0.1', port, allowedOrigins: [allowedOrigin] }));
  await writeFile(conversationsConfig, JSON.stringify({ archivePath: join(directory, 'archive.sqlite'), language: 'it' }));
  runtime = await startConversationServer({ AMBROGIO_HTTP_CONFIG_PATH: httpConfig,
    AMBROGIO_CONVERSATIONS_CONFIG_PATH: conversationsConfig }, directory, async () => ({
    orchestrator: { async *produce(history: { turns: { text: string }[] }): AsyncGenerator<ReplyPart> {
      const last = history.turns.at(-1)?.text;
      if (last === 'errore') { yield { kind: 'text', text: 'parziale' }; throw new Error('controlled failure'); }
      if (last === 'arresto') { yield { kind: 'text', text: 'sto pensando' }; await neverReply; }
      yield { kind: 'text', text: 'Ciao ' };
      yield { kind: 'text', text: 'dal server.' };
      yield { kind: 'reply_expectation', expectsReply: false };
    } },
    async close() {},
  })) as Runtime;
  base = new URL(`http://127.0.0.1:${port}/`);
});

afterAll(async () => {
  await runtime?.close();
  await rm(directory, { recursive: true, force: true });
});

describe('web client against the pinned backend', () => {
  it('converses, consults, enforces origins and reports interruptions through public interfaces', async () => {
    const page = session(allowedOrigin);
    const deltas: string[] = [];
    const first = await page.send('ciao', null, { delta: text => deltas.push(text) });
    expect(first.ok && first.value.answer).toBe('Ciao dal server.');
    expect(deltas).toEqual(['Ciao ', 'dal server.']);
    const conversationId = first.ok ? first.value.conversationId : '';

    const list = await api().list();
    expect(list.ok && list.value.items.map(item => item.id)).toEqual([conversationId]);
    const history = await api().history(conversationId);
    expect(history.ok && history.value.turns.map(turn => [turn.text, turn.status, turn.answer]))
      .toEqual([['ciao', 'answered', 'Ciao dal server.']]);

    expect(await page.send('errore', conversationId)).toEqual({ ok: false,
      error: { kind: 'failed', conversationId, message: 'Non riesco a completare la risposta.' } });
    expect(await page.send('ciao', '00000000-0000-4000-8000-000000000000')).toMatchObject({ ok: false,
      error: { kind: 'rejected', message: 'Conversazione non trovata.' } });

    const allowed = await fetch(new URL('api/conversations', base), { headers: { Origin: allowedOrigin } });
    expect(allowed.headers.get('access-control-allow-origin')).toBe(allowedOrigin);
    const refused = await fetch(new URL('api/conversations', base), { headers: { Origin: otherOrigin } });
    expect(refused.headers.get('access-control-allow-origin')).toBeNull();
    const stranger = session(otherOrigin);
    expect(await stranger.send('ciao', null)).toEqual({ ok: false, error: { kind: 'unreachable' } });

    const stopping = page.send('arresto', conversationId);
    await until(async () => {
      const current = await api().history(conversationId);
      return current.ok && current.value.turns.at(-1)?.status === 'pending';
    }, 'the turn to interrupt');
    const closing = runtime!.close();
    runtime = undefined;
    expect(await stopping).toEqual({ ok: false, error: { kind: 'interrupted', conversationId } });
    await closing;
  });
});
