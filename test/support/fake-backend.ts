import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { WebSocketServer, type WebSocket } from 'ws';

export type Message = Record<string, unknown>;

/** What the simulated backend does when a turn has been fully transmitted. */
export type TurnScript = (turn: { requestId: string; text: string; conversationId: string | null },
  reply: (message: Message) => void, socket: WebSocket) => void;

export type FakeBackend = {
  readonly base: URL;
  readonly received: Message[];
  connections(): number;
  close(): Promise<void>;
};

/** A WebSocket server speaking `ambrogio.v1` on `/api/session`, scripted per turn. */
export async function startFakeBackend(script: TurnScript, options: { ready?: boolean } = {}): Promise<FakeBackend> {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0, path: '/api/session',
    handleProtocols: protocols => (protocols.has('ambrogio.v1') ? 'ambrogio.v1' : false) });
  const received: Message[] = [];
  let connections = 0;
  server.on('connection', socket => {
    connections += 1;
    const turns = new Map<string, { text: string; conversationId: string | null }>();
    const reply = (message: Message) => socket.send(JSON.stringify(message));
    socket.on('message', data => {
      const message = JSON.parse(String(data)) as Message;
      received.push(message);
      const requestId = String(message.requestId);
      switch (message.type) {
        case 'session.hello':
          if (options.ready !== false) reply({ type: 'session.ready', protocol: 'ambrogio.v1' });
          return;
        case 'input.start':
          turns.set(requestId, { text: '', conversationId: typeof message.conversationId === 'string'
            ? message.conversationId : null });
          return;
        case 'input.chunk':
          turns.get(requestId)!.text += String(message.text);
          return;
        case 'input.end': {
          const turn = turns.get(requestId)!;
          script({ requestId, ...turn }, reply, socket);
        }
      }
    });
  });
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  return {
    base: new URL(`http://127.0.0.1:${port}/`),
    received,
    connections: () => connections,
    close: () => new Promise(resolve => {
      for (const client of server.clients) client.terminate();
      server.close(() => resolve());
    }),
  };
}
