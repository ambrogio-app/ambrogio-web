import type { BrowserDependencies } from '../../src/app/browser';
import type { SessionSocket } from '../../src/features/session/model/conversation-session';

export type StoredTurn = { id: string; text: string; status: 'pending' | 'answered' | 'failed' | 'interrupted';
  answer?: string; error?: string };
export type Message = Record<string, unknown>;

/** A turn received by the simulated backend, answered step by step by the test. */
export class ServerTurn {
  conversationId: string | null;
  turnId = '';
  constructor(private readonly socket: FakeSocket, readonly requestId: string, readonly text: string,
    conversationId: string | null) {
    this.conversationId = conversationId;
  }

  accept(conversationId = this.conversationId ?? crypto.randomUUID()): this {
    this.conversationId = conversationId;
    this.turnId = crypto.randomUUID();
    this.socket.deliver({ type: 'turn.accepted', requestId: this.requestId, conversationId, turnId: this.turnId,
      text: this.text });
    this.socket.deliver({ type: 'output.start', requestId: this.requestId, turnId: this.turnId,
      stream: this.socket.stream, content: { type: 'text' } });
    return this;
  }

  chunk(text: string): this {
    this.socket.deliver({ type: 'output.chunk', stream: this.socket.stream, text });
    return this;
  }

  complete(): void {
    this.socket.deliver({ type: 'output.end', stream: this.socket.stream });
    this.socket.deliver({ type: 'turn.completed', turnId: this.turnId, expectsReply: false });
  }

  fail(message: string): void { this.socket.deliver({ type: 'turn.failed', turnId: this.turnId, message }); }
  interrupt(): void { this.socket.deliver({ type: 'turn.interrupted', turnId: this.turnId }); }
  reject(message: string): void {
    this.socket.deliver({ type: 'turn.rejected', requestId: this.requestId, reason: 'occupied', message });
  }
}

type Listener = (event: { data?: unknown }) => void;

export class FakeSocket {
  readonly protocol = 'ambrogio.v1';
  readyState = 0;
  stream = 0;
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly inputs = new Map<string, { text: string; conversationId: string | null }>();

  constructor(private readonly server: FakeServer) {
    queueMicrotask(() => { this.readyState = 1; this.emit('open', {}); });
  }

  addEventListener(type: string, listener: Listener): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: Listener): void { this.listeners.get(type)?.delete(listener); }

  send(data: string): void {
    const message = JSON.parse(data) as Message;
    this.server.received.push(message);
    const requestId = String(message.requestId);
    if (message.type === 'session.hello') this.deliver({ type: 'session.ready', protocol: 'ambrogio.v1' });
    if (message.type === 'input.start') {
      this.stream = Number(message.stream);
      this.inputs.set(requestId, { text: '', conversationId: (message.conversationId as string | undefined) ?? null });
    }
    if (message.type === 'input.chunk') this.inputs.get(requestId)!.text += String(message.text);
    if (message.type === 'input.end') {
      const input = this.inputs.get(requestId)!;
      this.server.turns.push(new ServerTurn(this, requestId, input.text, input.conversationId));
    }
  }

  close(): void {
    if (this.readyState === 3) return;
    this.readyState = 3;
    queueMicrotask(() => this.emit('close', {}));
  }

  deliver(message: Message): void { this.emit('message', { data: JSON.stringify(message) }); }

  private emit(type: string, event: { data?: unknown }): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
  }
}

/** In-memory backend: HTTP consultation routes and the conversation channel. */
export class FakeServer {
  readonly conversations = new Map<string, StoredTurn[]>();
  readonly unreadable = new Set<string>();
  readonly received: Message[] = [];
  readonly turns: ServerTurn[] = [];
  readonly requests: string[] = [];
  readonly sockets: FakeSocket[] = [];
  pageSize = 50;

  store(id: string, ...turns: StoredTurn[]): void { this.conversations.set(id, turns); }

  respond(url: URL): Response {
    this.requests.push(url.pathname + url.search);
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
    if (url.pathname === '/api/v1/conversations') {
      const ids = [...this.conversations.keys()];
      const start = Number(url.searchParams.get('cursor') ?? 0);
      const end = start + this.pageSize;
      return json({ items: ids.slice(start, end).map(id => ({ id, lastActivityAt: '2026-10-18T08:00:00.000Z' })),
        nextCursor: end < ids.length ? String(end) : null });
    }
    const id = decodeURIComponent(url.pathname.replace('/api/v1/conversations/', ''));
    const problem = (body: unknown, status: number) => new Response(JSON.stringify(body),
      { status, headers: { 'Content-Type': 'application/problem+json' } });
    if (this.unreadable.has(id)) {
      return problem({ type: 'about:blank', title: 'Internal Server Error', status: 500 }, 500);
    }
    const turns = this.conversations.get(id);
    if (!turns) {
      return problem({ type: '/problems/conversation-not-found', title: 'Conversation not found', status: 404 }, 404);
    }
    return json({ id, createdAt: '2026-10-18T08:00:00.000Z', lastActivityAt: '2026-10-18T08:00:00.000Z',
      turns: turns.map(turn => ({ acceptedAt: '2026-10-18T08:00:00.000Z', ...turn })) });
  }

  lastTurn(): ServerTurn { return this.turns.at(-1)!; }
}

export type FakeBrowser = BrowserDependencies & {
  readonly server: FakeServer;
  readonly pushed: string[];
  setFragment(fragment: string): void;
  setNarrow(narrow: boolean): void;
};

export function fakeBrowser(options: { config?: unknown; fragment?: string; narrow?: boolean;
  languages?: readonly string[] } = {}): FakeBrowser {
  const server = new FakeServer();
  let fragment = options.fragment ?? '';
  let narrow = options.narrow ?? false;
  const fragmentListeners = new Set<() => void>();
  const layoutListeners = new Set<() => void>();
  const pushed: string[] = [];
  const config = options.config ?? { backendUrl: 'https://ambrogio.example.com', language: 'it' };
  return {
    server,
    pushed,
    fetch: async url => {
      if (url.pathname === '/config.json') return new Response(JSON.stringify(config));
      return server.respond(url);
    },
    configUrl: new URL('https://web.example.com/config.json'),
    languages: options.languages ?? ['it-IT'],
    openSocket: () => {
      const socket = new FakeSocket(server);
      server.sockets.push(socket);
      return socket as unknown as SessionSocket;
    },
    storage: undefined,
    userAgent: 'Mozilla/5.0 Firefox/140.0',
    randomBytes: bytes => crypto.getRandomValues(bytes),
    address: {
      fragment: () => fragment,
      push: value => { fragment = value; pushed.push(value); },
      subscribe: listener => { fragmentListeners.add(listener); return () => fragmentListeners.delete(listener); },
    },
    narrowLayout: {
      matches: () => narrow,
      subscribe: listener => { layoutListeners.add(listener); return () => layoutListeners.delete(listener); },
    },
    setFragment: value => { fragment = value; fragmentListeners.forEach(listener => listener()); },
    setNarrow: value => { narrow = value; layoutListeners.forEach(listener => listener()); },
  };
}
