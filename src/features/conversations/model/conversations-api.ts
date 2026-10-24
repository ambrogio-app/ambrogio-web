import { err, ok, type Result } from '../../../shared/result';

export type ConversationSummary = { readonly id: string; readonly lastActivityAt: string };
export type ConversationPage = { readonly items: readonly ConversationSummary[]; readonly nextCursor: string | null };

export type StoredTurn = {
  readonly id: string;
  readonly text: string;
  readonly acceptedAt: string;
  readonly status: 'pending' | 'answered' | 'failed' | 'interrupted';
  readonly answer?: string;
  readonly error?: string;
  readonly finishedAt?: string;
};

export type Conversation = {
  readonly id: string;
  readonly createdAt: string;
  readonly lastActivityAt: string;
  readonly turns: readonly StoredTurn[];
};

export type ReadFailure =
  | { readonly kind: 'unreachable' }
  | { readonly kind: 'invalid-response' }
  /** An error answer: `type` is the Problem Details discriminant, null when the body is not a problem. */
  | { readonly kind: 'http-error'; readonly status: number; readonly type: string | null };

export type FetchJson = (url: URL, init: RequestInit) => Promise<Response>;

type Fields = Record<string, unknown>;

const statuses = new Set(['pending', 'answered', 'failed', 'interrupted']);

function fields(value: unknown): Fields | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Fields : null;
}

function text(value: unknown): value is string { return typeof value === 'string'; }

function parsePage(value: unknown): ConversationPage | null {
  const body = fields(value);
  if (!body || !Array.isArray(body.items) || !(body.nextCursor === null || text(body.nextCursor))) return null;
  const items: ConversationSummary[] = [];
  for (const item of body.items) {
    const entry = fields(item);
    if (!entry || !text(entry.id) || !text(entry.lastActivityAt)) return null;
    items.push({ id: entry.id, lastActivityAt: entry.lastActivityAt });
  }
  return { items, nextCursor: body.nextCursor };
}

function parseTurn(value: unknown): StoredTurn | null {
  const turn = fields(value);
  if (!turn || !text(turn.id) || !text(turn.text) || !text(turn.acceptedAt) || !statuses.has(String(turn.status))) {
    return null;
  }
  const status = turn.status as StoredTurn['status'];
  if (status === 'answered' && !text(turn.answer)) return null;
  if (status === 'failed' && !text(turn.error)) return null;
  return { id: turn.id, text: turn.text, acceptedAt: turn.acceptedAt, status,
    ...(text(turn.answer) ? { answer: turn.answer } : {}),
    ...(text(turn.error) ? { error: turn.error } : {}),
    ...(text(turn.finishedAt) ? { finishedAt: turn.finishedAt } : {}) };
}

function parseConversation(value: unknown): Conversation | null {
  const body = fields(value);
  if (!body || !text(body.id) || !text(body.createdAt) || !text(body.lastActivityAt) || !Array.isArray(body.turns)) {
    return null;
  }
  const turns: StoredTurn[] = [];
  for (const item of body.turns) {
    const turn = parseTurn(item);
    if (!turn) return null;
    turns.push(turn);
  }
  return { id: body.id, createdAt: body.createdAt, lastActivityAt: body.lastActivityAt, turns };
}

/** The `type` of a Problem Details answer; title and detail are never read. */
function problemType(response: Response, body: unknown): string | null {
  const mediaType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  const type = fields(body)?.type;
  return mediaType === 'application/problem+json' && text(type) ? type : null;
}

/** Public HTTP consultation routes of HTTP API v1 of the backend. */
export class ConversationsApi {
  constructor(private readonly base: URL, private readonly fetchJson: FetchJson) {}

  async list(cursor?: string): Promise<Result<ConversationPage, ReadFailure>> {
    const url = new URL('api/v1/conversations', this.base);
    if (cursor !== undefined) url.searchParams.set('cursor', cursor);
    return this.read(url, parsePage);
  }

  async history(conversationId: string): Promise<Result<Conversation, ReadFailure>> {
    return this.read(new URL(`api/v1/conversations/${encodeURIComponent(conversationId)}`, this.base), parseConversation);
  }

  private async read<T>(url: URL, parse: (value: unknown) => T | null): Promise<Result<T, ReadFailure>> {
    let response: Response;
    try {
      response = await this.fetchJson(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    } catch {
      return err({ kind: 'unreachable' });
    }
    let body: unknown;
    try { body = await response.json(); } catch { body = undefined; }
    if (!response.ok) {
      const type = problemType(response, body);
      return err({ kind: 'http-error', status: response.status, type });
    }
    const parsed = parse(body);
    return parsed === null ? err({ kind: 'invalid-response' }) : ok(parsed);
  }
}
