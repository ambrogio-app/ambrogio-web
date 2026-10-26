import { err, ok, type Result } from '../../../shared/result';
import type { ClientIdentity } from './client-identity';

export const protocol = 'ambrogio.v1';
export const maxTextBytes = 65_536;
export const readyTimeoutMs = 10_000;

/** The part of the WebSocket API the session uses, as provided by browsers and Node.js. */
export type SessionSocket = Pick<WebSocket, 'protocol' | 'readyState' | 'send' | 'close'
  | 'addEventListener' | 'removeEventListener'>;
export type OpenSocket = (url: URL, protocol: string) => SessionSocket;

export type CompletedTurn = { readonly conversationId: string; readonly turnId: string; readonly answer: string };

export type TurnFailure =
  | { readonly kind: 'empty' }
  | { readonly kind: 'too-large' }
  | { readonly kind: 'unreachable' }
  | { readonly kind: 'rejected'; readonly conversationId: string | null; readonly message: string }
  | { readonly kind: 'failed'; readonly conversationId: string | null; readonly message: string }
  | { readonly kind: 'interrupted'; readonly conversationId: string | null }
  | { readonly kind: 'protocol'; readonly conversationId: string | null };

export type TurnEvents = {
  /** The backend admitted the turn and named its conversation. */
  readonly accepted?: (conversationId: string, turnId: string) => void;
  /** A fragment of the progressive answer, in arrival order. */
  readonly delta?: (text: string) => void;
};

export type SessionOptions = {
  readonly openSocket: OpenSocket;
  readonly identity: ClientIdentity;
  readonly newId: () => string;
  readonly readyTimeoutMs?: number;
};

type Message = Record<string, unknown>;
type PendingTurn = {
  conversationId: string | null;
  turnId?: string;
  answer: string;
  readonly events: TurnEvents;
  readonly settle: (result: Result<CompletedTurn, TurnFailure>) => void;
};

const socketOpen = 1;

function record(value: unknown): Message | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Message : null;
}

function text(value: unknown): value is string { return typeof value === 'string'; }

/** WebSocket address of the conversation channel under the backend base URL. */
export function sessionUrl(base: URL): URL {
  const url = new URL('api/session', base);
  url.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  return url;
}

/** Checks a turn text before it opens the session or reaches the backend. */
export function validateTurnText(value: string): Result<string, TurnFailure> {
  if (!value.trim()) return err({ kind: 'empty' });
  if (new TextEncoder().encode(value).byteLength > maxTextBytes) return err({ kind: 'too-large' });
  return ok(value);
}

/** One open `ambrogio.v1` session carrying the turns of every conversation. */
class OpenSession {
  private readonly turns = new Map<string, PendingTurn>();
  private readonly streams = new Map<number, string>();
  private nextStream = 1;
  closed = false;

  constructor(private readonly socket: SessionSocket) {
    socket.addEventListener('message', event => this.receive(event.data));
    socket.addEventListener('close', () => this.release());
  }

  send(requestId: string, value: string, conversationId: string | null, events: TurnEvents) {
    const stream = this.nextStream++;
    return new Promise<Result<CompletedTurn, TurnFailure>>(resolve => {
      this.turns.set(requestId, { conversationId, answer: '', events,
        settle: result => { this.turns.delete(requestId); resolve(result); } });
      this.write({ type: 'input.start', requestId, stream, content: { type: 'text' }, reply: 'text',
        ...(conversationId === null ? {} : { conversationId }) });
      this.write({ type: 'input.chunk', requestId, text: value });
      this.write({ type: 'input.end', requestId });
    });
  }

  close(): void { this.socket.close(1000); }

  private write(message: Message): void {
    if (this.socket.readyState === socketOpen) this.socket.send(JSON.stringify(message));
  }

  private turnByRequest(requestId: unknown): PendingTurn | undefined {
    return text(requestId) ? this.turns.get(requestId) : undefined;
  }

  private turnByTurnId(turnId: unknown): PendingTurn | undefined {
    return [...this.turns.values()].find(turn => turn.turnId !== undefined && turn.turnId === turnId);
  }

  private receive(data: unknown): void {
    if (!text(data)) return;
    let parsed: unknown;
    try { parsed = JSON.parse(data); } catch { return; }
    const message = record(parsed);
    if (!message || !text(message.type)) return;
    switch (message.type) {
      case 'turn.accepted': {
        const turn = this.turnByRequest(message.requestId);
        if (turn && text(message.conversationId) && text(message.turnId)) {
          turn.conversationId = message.conversationId;
          turn.turnId = message.turnId;
          turn.events.accepted?.(message.conversationId, message.turnId);
        }
        return;
      }
      case 'output.start':
        if (this.turnByRequest(message.requestId) && typeof message.stream === 'number') {
          this.streams.set(message.stream, message.requestId as string);
        }
        return;
      case 'output.chunk': {
        const requestId = typeof message.stream === 'number' ? this.streams.get(message.stream) : undefined;
        const turn = this.turnByRequest(requestId);
        if (turn && text(message.text)) {
          turn.answer += message.text;
          turn.events.delta?.(message.text);
        }
        return;
      }
      case 'output.end':
        if (typeof message.stream === 'number') this.streams.delete(message.stream);
        return;
      case 'turn.completed': {
        const turn = this.turnByTurnId(message.turnId);
        if (turn) turn.settle(ok({ conversationId: turn.conversationId!, turnId: turn.turnId!, answer: turn.answer }));
        return;
      }
      case 'turn.failed': {
        const turn = this.turnByTurnId(message.turnId);
        if (turn && text(message.message)) {
          turn.settle(err({ kind: 'failed', conversationId: turn.conversationId, message: message.message }));
        }
        return;
      }
      case 'turn.interrupted': {
        const turn = this.turnByTurnId(message.turnId);
        if (turn) turn.settle(err({ kind: 'interrupted', conversationId: turn.conversationId }));
        return;
      }
      case 'turn.rejected': {
        const turn = this.turnByRequest(message.requestId);
        if (turn && text(message.message)) {
          turn.settle(err({ kind: 'rejected', conversationId: turn.conversationId, message: message.message }));
        }
        return;
      }
      case 'session.error': {
        const turn = this.turnByRequest(message.requestId);
        if (turn) turn.settle(err({ kind: 'protocol', conversationId: turn.conversationId }));
        return;
      }
      default:
        // A server message of an unknown type is ignored.
    }
  }

  private release(): void {
    if (this.closed) return;
    this.closed = true;
    for (const turn of [...this.turns.values()]) {
      turn.settle(err({ kind: 'interrupted', conversationId: turn.conversationId }));
    }
  }
}

function open(url: URL, options: SessionOptions): Promise<OpenSession | null> {
  const socket = options.openSocket(url, protocol);
  const session = new OpenSession(socket);
  return new Promise(resolve => {
    const finish = (value: OpenSession | null) => {
      clearTimeout(timer);
      socket.removeEventListener('close', fail);
      socket.removeEventListener('message', ready);
      resolve(value);
    };
    const fail = () => finish(null);
    const timer = setTimeout(() => { socket.close(); finish(null); }, options.readyTimeoutMs ?? readyTimeoutMs);
    const ready = (event: MessageEvent) => {
      if (!text(event.data)) return;
      let message: unknown;
      try { message = JSON.parse(event.data); } catch { return; }
      if (record(message)?.type === 'session.ready') finish(session);
    };
    socket.addEventListener('close', fail);
    socket.addEventListener('message', ready);
    socket.addEventListener('open', () => {
      if (socket.protocol !== protocol) { socket.close(); return; }
      socket.send(JSON.stringify({ type: 'session.hello', clientId: options.identity.clientId,
        name: options.identity.name }));
    }, { once: true });
  });
}

/** The page's single session: opened at the first turn and reopened after it closes. */
export class ConversationSession {
  private current: Promise<OpenSession | null> | undefined;

  constructor(private readonly base: URL, private readonly options: SessionOptions) {}

  async send(value: string, conversationId: string | null,
    events: TurnEvents = {}): Promise<Result<CompletedTurn, TurnFailure>> {
    const valid = validateTurnText(value);
    if (!valid.ok) return valid;
    let session = await this.current;
    if (!session || session.closed) {
      this.current = open(sessionUrl(this.base), this.options);
      session = await this.current;
    }
    if (!session) {
      this.current = undefined;
      return err({ kind: 'unreachable' });
    }
    return session.send(this.options.newId(), value, conversationId, events);
  }

  async close(): Promise<void> {
    (await this.current)?.close();
  }
}
