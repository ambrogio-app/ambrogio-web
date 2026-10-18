<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/logo-dark.svg">
    <img src=".github/logo-light.svg" alt="Ambrogio" width="320">
  </picture>
</p>

# Ambrogio — web chat

**Ambrogio** is an open source home assistant that you host yourself. This repository is its **web chat client**: an optional browser interface for talking to an Ambrogio backend, as an alternative to the terminal client.

| Repository | Role |
|---|---|
| [ambrogio-backend](https://github.com/ambrogio-app/ambrogio-backend) | Conversation server, agents, speech, storage, public protocol |
| [ambrogio-cli](https://github.com/ambrogio-app/ambrogio-cli) | Terminal chat client |
| [ambrogio-satellite](https://github.com/ambrogio-app/ambrogio-satellite) | Voice satellite with wake word, microphone and speaker |
| **ambrogio-web** (this one) | Optional web chat client |

> Ambrogio is in early development.

## How it works

The page lists your conversations on the left and shows the open one on the right, with a field to write in. The backend stores every conversation, so a chat started from the terminal or a voice satellite can go on here, and the other way round. Answers stream in as the backend produces them and are shown as Markdown.

```mermaid
flowchart LR
    U((You)) --> B[Browser]
    B -- "config.json" --> W[ambrogio-web container]
    B -- "GET /api/conversations<br/>list and history" --> A[ambrogio-backend]
    B <-- "WebSocket /api/session<br/>ambrogio.v1 turns" --> A
```

- The container serves only static files. The browser talks to the backend directly, so the backend must allow the origin of this page in its HTTP component (`allowedOrigins`).
- The page reads `config.json` next to `index.html` when it opens. The file is not in the image: you mount it.
- The browser identifies itself as `web-<random UUID>`, kept in the browser's local storage.

The backend version this client is compatible with is recorded in [`system-model/Contracts/WebConversation.md`](system-model/Contracts/WebConversation.md).

## Configuration

`config.json`:

```json
{
  "backendUrl": "https://ambrogio.example.com",
  "language": "it"
}
```

| Field | Required | Meaning |
|---|---|---|
| `backendUrl` | yes | Absolute HTTP(S) base URL of the backend, without credentials, query or fragment |
| `language` | no | Interface language, `it` or `en`. Without it the page follows the browser, with English as fallback |

Any other field makes the configuration invalid, and the page shows the reason.

## Run with Docker

```bash
docker run -d --name ambrogio-web -p 8080:8080 \
  -v "$PWD/config.json:/usr/share/nginx/html/config.json:ro" \
  ghcr.io/ambrogio-app/ambrogio-web:<version>
```

The container listens on port 8080 as an unprivileged user. HTTPS belongs to your reverse proxy.

## Development

```bash
npm ci
cp config.example.json public/config.json   # then set backendUrl
npm run dev
```

| Command | What it does |
|---|---|
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit and interface tests with a simulated backend |
| `npm run build` | Static files in `dist/` |
| `npm run test:backend` | Integration test against a checkout of `ambrogio-backend` at the pinned revision, next to this repository or in `AMBROGIO_BACKEND_REPO`, built with `pnpm build` |
| `node scripts/verify-docker-image.mjs <image>` | Checks a built image: user, port, headers and cache |

The code is organised by feature in `src/features/` (`configuration`, `session`, `conversations`, `chat`), each with a pure `model/` and a React `ui/`; shared code is in `src/shared/` and `src/app/` wires the features together.

## Engineering model

Requirements, contracts and verifications live in [`system-model/`](system-model/) and are managed with [Reqvire](https://reqvire.org/). Read them before changing behaviour.

## License

[MIT](LICENSE)
