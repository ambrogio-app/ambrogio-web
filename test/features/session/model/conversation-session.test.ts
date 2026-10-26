import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ConversationSession, readyTimeoutMs, sessionUrl, validateTurnText,
} from '../../../../src/features/session/model/conversation-session';
import { startFakeBackend, type FakeBackend, type TurnScript } from '../../../support/fake-backend';

const identity = { clientId: 'web-00000000-0000-4000-8000-000000000000', name: 'Web Firefox' };
let backend: FakeBackend | undefined;
let sessions: ConversationSession[] = [];
let ids = 0;

afterEach(async () => {
  await Promise.all(sessions.map(session => session.close()));
  sessions = [];
  await backend?.close();
  backend = undefined;
});

function session(base: URL, readyTimeoutMs?: number): ConversationSession {
  const created = new ConversationSession(base, {
    openSocket: (url, protocol) => new WebSocket(url, protocol),
    identity,
    newId: () => `request-${++ids}`,
    ...(readyTimeoutMs === undefined ? {} : { readyTimeoutMs }),
  });
  sessions.push(created);
  return created;
}

const answerIn = (conversationId: string, fragments: string[], delay = 0): TurnScript => (turn, reply) => {
  reply({ type: 'turn.accepted', requestId: turn.requestId, conversationId, turnId: `turn-${conversationId}`, text: turn.text });
  reply({ type: 'output.start', requestId: turn.requestId, turnId: `turn-${conversationId}`, stream: 7,
    content: { type: 'text' } });
  for (const fragment of fragments) reply({ type: 'output.chunk', stream: 7, text: fragment });
  setTimeout(() => {
    reply({ type: 'output.end', stream: 7 });
    reply({ type: 'turn.completed', turnId: `turn-${conversationId}`, expectsReply: true });
  }, delay);
};

const scenarios: Record<string, TurnScript> = {
  ciao: answerIn('c-1', ['Ciao ', 'mondo']),
  rifiuta: (turn, reply) => reply({ type: 'turn.rejected', requestId: turn.requestId, reason: 'occupied',
    message: 'Conversazione occupata.' }),
  guasto: (turn, reply) => {
    reply({ type: 'turn.accepted', requestId: turn.requestId, conversationId: 'c-2', turnId: 't-2', text: turn.text });
    reply({ type: 'output.start', requestId: turn.requestId, turnId: 't-2', stream: 3, content: { type: 'text' } });
    reply({ type: 'output.chunk', stream: 3, text: 'parziale' });
    reply({ type: 'turn.failed', turnId: 't-2', message: 'Errore pubblico.' });
  },
  interrompi: (turn, reply) => {
    reply({ type: 'turn.accepted', requestId: turn.requestId, conversationId: 'c-3', turnId: 't-3', text: turn.text });
    reply({ type: 'turn.interrupted', turnId: 't-3' });
  },
  chiudi: (turn, reply, socket) => {
    reply({ type: 'turn.accepted', requestId: turn.requestId, conversationId: 'c-4', turnId: 't-4', text: turn.text });
    setTimeout(() => socket.close(), 5);
  },
  protocollo: (turn, reply) => reply({ type: 'session.error', code: 'invalid_message', message: 'invalid',
    requestId: turn.requestId }),
  richiesta: (turn, reply) => {
    reply({ type: 'device.command', id: 'command-1' });
    answerIn('c-5', ['ok'])(turn, reply, undefined as never);
  },
  lento: answerIn('c-slow', ['lento'], 80),
  veloce: answerIn('c-fast', ['veloce']),
};

const script: TurnScript = (turn, reply, socket) => scenarios[turn.text]!(turn, reply, socket);

describe('validateTurnText', () => {
  it('refuses empty, blank and oversized texts', () => {
    expect(validateTurnText('')).toEqual({ ok: false, error: { kind: 'empty' } });
    expect(validateTurnText(' \n\t')).toEqual({ ok: false, error: { kind: 'empty' } });
    expect(validateTurnText('è'.repeat(32_769))).toEqual({ ok: false, error: { kind: 'too-large' } });
    expect(validateTurnText('a'.repeat(65_536)).ok).toBe(true);
  });
});

describe('sessionUrl', () => {
  it('uses ws for http and wss for https under the base path', () => {
    expect(sessionUrl(new URL('http://ambrogio.example.com/base/')).href).toBe('ws://ambrogio.example.com/base/api/session');
    expect(sessionUrl(new URL('https://ambrogio.example.com/')).href).toBe('wss://ambrogio.example.com/api/session');
  });
});

describe('ConversationSession', () => {
  it('sends a text turn, shows fragments in order and succeeds only with turn.completed', async () => {
    backend = await startFakeBackend(script);
    const deltas: string[] = [];
    const accepted: string[] = [];
    const result = await session(backend.base).send('ciao', null, {
      accepted: conversationId => accepted.push(conversationId), delta: text => deltas.push(text) });
    expect(result).toEqual({ ok: true, value: { conversationId: 'c-1', turnId: 'turn-c-1', answer: 'Ciao mondo' } });
    expect(deltas).toEqual(['Ciao ', 'mondo']);
    expect(accepted).toEqual(['c-1']);
    const [hello, start, chunk, end] = backend.received;
    expect(hello).toEqual({ type: 'session.hello', clientId: identity.clientId, name: identity.name });
    expect(start).toMatchObject({ type: 'input.start', stream: 1, content: { type: 'text' }, reply: 'text' });
    expect(start).not.toHaveProperty('conversationId');
    expect(chunk).toEqual({ type: 'input.chunk', requestId: start!.requestId, text: 'ciao' });
    expect(end).toEqual({ type: 'input.end', requestId: start!.requestId });
  });

  it('continues a conversation and reuses one session for every turn', async () => {
    backend = await startFakeBackend(script);
    const page = session(backend.base);
    await page.send('ciao', null);
    await page.send('ciao', 'c-1');
    const starts = backend.received.filter(message => message.type === 'input.start');
    expect(starts[1]).toMatchObject({ conversationId: 'c-1', stream: 2 });
    expect(starts[0]!.requestId).not.toBe(starts[1]!.requestId);
    expect(backend.connections()).toBe(1);
  });

  it('runs turns of different conversations in parallel', async () => {
    backend = await startFakeBackend(script);
    const page = session(backend.base);
    const finished: string[] = [];
    await Promise.all([
      page.send('lento', null).then(result => finished.push(result.ok ? result.value.answer : 'error')),
      page.send('veloce', 'c-other').then(result => finished.push(result.ok ? result.value.answer : 'error')),
    ]);
    expect(finished).toEqual(['veloce', 'lento']);
  });

  it('refuses texts locally without opening the session', async () => {
    backend = await startFakeBackend(script);
    const page = session(backend.base);
    expect(await page.send('   ', null)).toEqual({ ok: false, error: { kind: 'empty' } });
    expect(await page.send('x'.repeat(65_537), null)).toEqual({ ok: false, error: { kind: 'too-large' } });
    expect(backend.connections()).toBe(0);
  });

  it('reports rejection, failure after fragments, interruption and protocol errors', async () => {
    backend = await startFakeBackend(script);
    const page = session(backend.base);
    expect(await page.send('rifiuta', 'c-busy')).toEqual({ ok: false,
      error: { kind: 'rejected', conversationId: 'c-busy', message: 'Conversazione occupata.' } });
    expect(await page.send('guasto', null)).toEqual({ ok: false,
      error: { kind: 'failed', conversationId: 'c-2', message: 'Errore pubblico.' } });
    expect(await page.send('interrompi', null)).toEqual({ ok: false,
      error: { kind: 'interrupted', conversationId: 'c-3' } });
    expect(await page.send('protocollo', null)).toEqual({ ok: false,
      error: { kind: 'protocol', conversationId: null } });
  });

  it('interrupts the turn when the session closes and reopens it for the next turn', async () => {
    backend = await startFakeBackend(script);
    const page = session(backend.base);
    expect(await page.send('chiudi', null)).toEqual({ ok: false, error: { kind: 'interrupted', conversationId: 'c-4' } });
    expect((await page.send('ciao', null)).ok).toBe(true);
    expect(backend.connections()).toBe(2);
  });

  it('ignores server messages of an unknown type without answering them', async () => {
    backend = await startFakeBackend(script);
    const received = backend.received;
    expect((await session(backend.base).send('richiesta', null)).ok).toBe(true);
    expect(received.filter(message => message.type === 'client.result')).toEqual([]);
  });

  it('waits ten seconds for session.ready by default', () => {
    expect(readyTimeoutMs).toBe(10_000);
  });

  it('reports the backend as unreachable without session.ready', async () => {
    backend = await startFakeBackend(script, { ready: false });
    expect(await session(backend.base, 50).send('ciao', null)).toEqual({ ok: false, error: { kind: 'unreachable' } });
  });

  it('reports the backend as unreachable when nothing listens', async () => {
    expect(await session(new URL('http://127.0.0.1:9/'), 2_000).send('ciao', null))
      .toEqual({ ok: false, error: { kind: 'unreachable' } });
  });
});

