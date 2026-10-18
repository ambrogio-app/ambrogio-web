import { describe, expect, it, vi } from 'vitest';
import { ConversationsApi } from '../../../../src/features/conversations/model/conversations-api';

const base = new URL('https://ambrogio.example.com/base/');

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('ConversationsApi', () => {
  it('reads the first page and the next one through the opaque cursor', async () => {
    const fetchJson = vi.fn(async (_url: URL, _init: RequestInit) => json({ items: [{ id: 'c-1', lastActivityAt: '2026-10-18T08:00:00.000Z' }],
      nextCursor: 'opaque' }));
    const api = new ConversationsApi(base, fetchJson);
    expect(await api.list()).toEqual({ ok: true, value: { items: [{ id: 'c-1', lastActivityAt: '2026-10-18T08:00:00.000Z' }],
      nextCursor: 'opaque' } });
    await api.list('opaque');
    expect(fetchJson.mock.calls.map(call => String(call[0]))).toEqual([
      'https://ambrogio.example.com/base/api/conversations',
      'https://ambrogio.example.com/base/api/conversations?cursor=opaque',
    ]);
  });

  it('reads a history with every turn status', async () => {
    const history = { id: 'c-1', createdAt: 'a', lastActivityAt: 'b', turns: [
      { id: 't-1', text: 'uno', acceptedAt: 'a', status: 'answered', answer: 'risposta', finishedAt: 'b' },
      { id: 't-2', text: 'due', acceptedAt: 'a', status: 'failed', error: 'errore', finishedAt: 'b' },
      { id: 't-3', text: 'tre', acceptedAt: 'a', status: 'interrupted', finishedAt: 'b' },
      { id: 't-4', text: 'quattro', acceptedAt: 'a', status: 'pending' },
    ] };
    const fetchJson = vi.fn(async (_url: URL, _init: RequestInit) => json(history));
    expect(await new ConversationsApi(base, fetchJson).history('c-1')).toEqual({ ok: true, value: history });
    expect(String(fetchJson.mock.calls[0]![0])).toBe('https://ambrogio.example.com/base/api/conversations/c-1');
  });

  it('returns the public message of HTTP errors', async () => {
    const api = new ConversationsApi(base, async () => json({ error: 'Conversazione non trovata.' }, 404));
    expect(await api.history('missing')).toEqual({ ok: false,
      error: { kind: 'http-error', status: 404, message: 'Conversazione non trovata.' } });
  });

  it('distinguishes an unreachable backend from an invalid response', async () => {
    const unreachable = new ConversationsApi(base, async () => { throw new TypeError('network'); });
    const invalid = new ConversationsApi(base, async () => json({ items: 'no' }));
    const badTurn = new ConversationsApi(base, async () => json({ id: 'c', createdAt: 'a', lastActivityAt: 'b',
      turns: [{ id: 't', text: 'x', acceptedAt: 'a', status: 'answered' }] }));
    expect(await unreachable.list()).toEqual({ ok: false, error: { kind: 'unreachable' } });
    expect(await invalid.list()).toEqual({ ok: false, error: { kind: 'invalid-response' } });
    expect(await badTurn.history('c')).toEqual({ ok: false, error: { kind: 'invalid-response' } });
  });
});
