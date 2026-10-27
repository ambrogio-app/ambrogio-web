import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket as NodeWebSocket } from 'ws';
import { ConversationsApi } from '../src/features/conversations/model/conversations-api';
import {
  ConversationSession, type SessionSocket,
} from '../src/features/session/model/conversation-session';

const allowedOrigin = 'https://web.example.com';
const otherOrigin = 'https://other.example.com';
const webRoot = fileURLToPath(new URL('..', import.meta.url));
const backendRoot = resolve(process.env.AMBROGIO_BACKEND_REPO ?? resolve(webRoot, '../ambrogio-backend'));
/** The public test entry point of the backend: the only backend module this test imports. */
const testEntryPoint = join(backendRoot, 'apps/server/dist/runtime/test-server.js');

type ReplyPart = { kind: 'text'; text: string } | { kind: 'reply_expectation'; expectsReply: boolean };
type TestServer = { origin: string; sessionUrl: URL; close(): Promise<void> };
type StartTestServer = (options: {
  databaseUrl: string;
  language: 'it' | 'en';
  reply: { produce(history: { turns: readonly { text: string }[] }): AsyncIterable<ReplyPart> };
  allowedOrigins?: readonly string[];
}) => Promise<TestServer>;

let server: TestServer | undefined;
let base: URL;
const neverReply = new Promise<never>(() => {});

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
  if (!existsSync(join(backendRoot, '.git'))) {
    throw new Error(`No ambrogio-backend checkout at ${backendRoot}: check it out side by side or set AMBROGIO_BACKEND_REPO`);
  }
  if (!existsSync(testEntryPoint)) {
    throw new Error(`The backend at ${backendRoot} is not built: run pnpm install and pnpm build there`);
  }
  // The test entry creates and drops its own archive database on this PostgreSQL test server.
  const databaseUrl = process.env.AMBROGIO_TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error('Missing environment variable AMBROGIO_TEST_DATABASE_URL: start the PostgreSQL test server with ../ambrogio-model/scripts/test-postgres start and export the line it prints');
  const commit = execFileSync('git', ['-C', backendRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  process.stderr.write(`ambrogio-backend commit under test: ${commit}\n`);
  const { startTestServer } = await import(pathToFileURL(testEntryPoint).href) as { startTestServer: StartTestServer };
  server = await startTestServer({ databaseUrl, language: 'it', allowedOrigins: [allowedOrigin], reply: {
    async *produce(history) {
      const last = history.turns.at(-1)?.text;
      if (last === 'errore') { yield { kind: 'text', text: 'parziale' }; throw new Error('controlled failure'); }
      if (last === 'arresto') { yield { kind: 'text', text: 'sto pensando' }; await neverReply; }
      yield { kind: 'text', text: 'Ciao ' };
      yield { kind: 'text', text: 'dal server.' };
      yield { kind: 'reply_expectation', expectsReply: false };
    },
  } });
  base = new URL(`${server.origin}/`);
});

afterAll(async () => {
  await server?.close();
});

describe('web client against the side-by-side backend', () => {
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
    expect(await api().history('00000000-0000-4000-8000-000000000000')).toEqual({ ok: false,
      error: { kind: 'http-error', status: 404, type: '/problems/conversation-not-found' } });

    expect(await page.send('errore', conversationId)).toEqual({ ok: false,
      error: { kind: 'failed', conversationId, message: 'Non riesco a completare la risposta.' } });
    expect(await page.send('ciao', '00000000-0000-4000-8000-000000000000')).toMatchObject({ ok: false,
      error: { kind: 'rejected', message: 'Conversazione non trovata.' } });

    const allowed = await fetch(new URL('api/v1/conversations', base), { headers: { Origin: allowedOrigin } });
    expect(allowed.headers.get('access-control-allow-origin')).toBe(allowedOrigin);
    const refused = await fetch(new URL('api/v1/conversations', base), { headers: { Origin: otherOrigin } });
    expect(refused.headers.get('access-control-allow-origin')).toBeNull();
    const stranger = session(otherOrigin);
    expect(await stranger.send('ciao', null)).toEqual({ ok: false, error: { kind: 'unreachable' } });

    const stopping = page.send('arresto', conversationId);
    await until(async () => {
      const current = await api().history(conversationId);
      return current.ok && current.value.turns.at(-1)?.status === 'pending';
    }, 'the turn to interrupt');
    const closing = server!.close();
    server = undefined;
    expect(await stopping).toEqual({ ok: false, error: { kind: 'interrupted', conversationId } });
    await closing;
  });
});
