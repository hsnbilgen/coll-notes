# coll-notes

A real-time collaborative note-taking app I built as a side project to go deep on CRDTs, offline-first sync and editor UX. Multiple users can edit the same document simultaneously — edits merge without conflicts, cursors appear live, and full version history is always one click away.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [How It Works](#how-it-works)
4. [Quick Start with Docker](#quick-start-with-docker)
5. [Manual Setup](#manual-setup)
6. [Running Tests](#running-tests)
7. [CI / GitHub Actions](#ci--github-actions)
8. [Design Decisions](#design-decisions)
9. [AI Tools Used](#ai-tools-used)
10. [Known Trade-offs](#known-trade-offs)
11. [Roadmap](#roadmap)

---

## Features

**Writing**
- Block editor (Tiptap + ProseMirror): headings, lists, quotes, code blocks, dividers
- Slash menu (`/`) with icons and ready-made templates (meeting note, decision record), built as a custom ProseMirror plugin
- Inline title editing, focus mode (⌘⇧F), light and dark themes
- Live save status in the toolbar: *Saving → Saved*, or *Offline* when the connection drops

**Collaboration**
- Real-time co-editing over Yjs CRDTs: concurrent edits always converge, nothing is overwritten
- Named, colored live cursors plus a presence stack showing who is in the note
- Share links with **view** or **edit** permission; guests can join without an account
- "Shared with me" section for notes others have shared with you

**Safety net**
- Offline-first: edits persist to IndexedDB and sync automatically on reconnect
- Version history with automatic snapshots every 5 minutes, ⌘S for a manual snapshot, one-click restore
- Activity timeline per note (created, renamed, edited, versions, shares)
- Soft delete with a trash bin, restore, and two-step permanent delete

**Workspace**
- Per-user isolation enforced on every query; other users' notes return 404, never 403
- ⌘K search across your notes, duplicate, rename, recent notes on the home screen
- JWT auth, authenticated WebSocket rooms, read-only enforced for view links

**Engineering**
- REST under `/api/v1`, bookmarkable URLs for every view
- Strict TypeScript + ESLint (hooks rules as a correctness gate)
- Backend integration tests + frontend component/hook tests, GitHub Actions CI
- Docker Compose with healthcheck-ordered startup behind a single nginx entry point

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend runtime | Node.js | 22 LTS |
| Backend framework | Express | 4 |
| Language | TypeScript | 5 |
| ORM | Prisma | 7 |
| Database | PostgreSQL | 17 |
| Real-time sync | Yjs + y-websocket | 13 / 2 |
| Editor | Tiptap 2 + ProseMirror | 2.10 |
| Frontend framework | React | 18 |
| Frontend build | Vite | 6 |
| UI components | shadcn/ui + Tailwind CSS | — |
| Data fetching | TanStack Query | v5 |
| Auth | JWT (jsonwebtoken + bcryptjs) | — |
| Containerisation | Docker + Docker Compose | — |
| Testing | Vitest + Supertest + MSW | — |

---

## How It Works

### System Architecture

```
┌──────────────────────────────────────────┐
│              Browser (React SPA)          │
│                                          │
│  ┌────────────┐    ┌───────────────────┐ │
│  │  Tiptap    │    │  y-websocket      │ │
│  │  Editor    │←──→│  WebsocketProvider│ │
│  │            │    │  (Yjs CRDT)       │ │
│  └─────┬──────┘    └────────┬──────────┘ │
│        │ REST /api           │ WS /collab │
└────────┼────────────────────┼────────────┘
         │                    │
   ┌─────▼────────────────────▼──────────┐
   │           nginx (port 5173)          │
   │   /api    →  backend:3001  (HTTP)   │
   │   /collab →  backend:3002  (WS)     │
   └─────────────────┬───────────────────┘
                     │
   ┌─────────────────▼───────────────────┐
   │         Express API (port 3001)      │
   │  /api/v1/auth          auth routes   │
   │  /api/v1/documents     CRUD, share   │
   │  /api/v1/documents/:id/versions      │
   │  /api/v1/documents/:id/activity      │
   │  /api/v1/share/:token  share resolve │
   │  /api/v1/shared-with-me              │
   │  /health               healthcheck   │
   └─────────────────┬───────────────────┘
                     │
   ┌─────────────────▼───────────────────┐
   │      y-websocket server (port 3002)  │
   │  room per documentId                 │
   │  JWT + share token auth on connect   │
   │  Yjs state persisted to PostgreSQL   │
   └─────────────────┬───────────────────┘
                     │
   ┌─────────────────▼───────────────────┐
   │          PostgreSQL (port 5432)      │
   │  User, Document, DocumentVersion,    │
   │  DocumentShare, SavedShare           │
   └─────────────────────────────────────┘
```

### Real-time Collaboration Flow

1. When a user opens a document, the frontend creates a `Y.Doc` and connects a `WebsocketProvider` to `/collab/<documentId>` with the user's JWT as a query parameter.
2. The backend WebSocket server authenticates the connection (JWT owner check or valid share token), then calls `setupWSConnection` from `y-websocket` — this handles the full Yjs sync protocol: exchanging state vectors and broadcasting updates between all clients in the room.
3. Tiptap's `Collaboration` extension binds its document state directly to the `Y.Doc`. Every keystroke produces a Yjs update that is broadcast to all other clients and applied to their local `Y.Doc` in real time.
4. `setPersistence` wires Postgres as the storage layer: when a room first opens the saved Yjs binary is loaded; every update is debounced and flushed to `Document.content`; when the last client disconnects a final flush runs.
5. `CollaborationCursor` and the Yjs awareness protocol handle presence: each client broadcasts its cursor position and user info (name, colour); other clients render the cursor directly in ProseMirror.

### Offline Support

`y-indexeddb` creates a second persistence layer in the browser. Edits made while the WebSocket is down are written to IndexedDB immediately. On reconnect, Yjs performs a state vector exchange — the server sends only the updates the client missed, the client sends its queued offline edits. Merges are always conflict-free because Yjs is a CRDT.

### Authentication & Workspace Isolation

- Registration hashes the password with bcrypt (12 rounds) and returns a signed JWT.
- Every protected route runs `requireAuth` middleware which verifies the JWT and attaches `req.user`.
- Every document query includes `ownerId: req.user.id` — a user cannot read, modify, or delete another user's document. The response is always 404, never 403, to avoid confirming existence.
- WebSocket connections require a valid JWT (owner) or a valid share token (READ_ONLY or EDITABLE). Read-only enforcement is applied at the editor level — the `readOnly` prop disables all input, and the frontend skips the auto-save call.

### Document Versioning

The frontend snapshots the full Yjs binary state every 5 minutes and posts it to `POST /documents/:id/versions`. Each snapshot is stored as a `DocumentVersion` row (`Bytes` column). On restore, the chosen snapshot's binary is written back to `Document.content`, the in-memory Yjs room is evicted (`evictRoom`), and the frontend remounts the editor — so the next WebSocket connection loads the restored state cleanly from the database.

---

## Quick Start with Docker

**Prerequisites:** Docker and Docker Compose installed.

```bash
git clone <repo-url>
cd coll-notes

# Copy the env template and fill in your values
cp .env.example .env

# Build and start all three containers
docker compose up --build
```

Open [http://localhost:5173](http://localhost:5173). Register an account and start writing.

**To test real-time collaboration:** open the app in two browser windows with different accounts. Share a document using the Share button (top right of the editor), open the link in the second window — both cursors and edits appear live.

Docker Compose starts services in dependency order enforced by healthchecks:
1. **postgres** — waits until `pg_isready` succeeds
2. **backend** — waits until postgres is healthy, runs migrations, starts Express + WS server, waits until `GET /health` returns 200
3. **frontend** — waits until backend is healthy, then nginx starts

This means the browser will never hit `ERR_CONNECTION_REFUSED` on cold start.

**Environment variables** (`.env` at project root):

| Variable | Description | Default in `.env.example` |
|---|---|---|
| `POSTGRES_USER` | PostgreSQL user | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_DB` | Database name | `collnotes` |
| `DATABASE_URL` | Full connection string — must match the three above | see `.env.example` |
| `JWT_SECRET` | Secret for signing JWTs — **change in production** | `dev-secret-change-in-production` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `FRONTEND_URL` | Used to construct shareable link URLs | `http://localhost:5173` |
| `VITE_SAVE_DEBOUNCE_MS` | Auto-save debounce delay in milliseconds — lower = more frequent saves, higher = fewer writes. Baked into the frontend at build time. | `500` |

---

## Manual Setup

Requires Node.js 22+ and PostgreSQL 17 running locally.

**Backend:**

```bash
cd backend
cp .env.example .env        # set DATABASE_URL to your local postgres
npm install
./node_modules/.bin/prisma migrate deploy
npm run dev                 # REST API on :3001, WS server on :3002
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev                 # Vite dev server on :5173
```

The frontend proxies `/api` and `/collab` via Vite's dev proxy — no nginx needed locally.

---

## Running Tests

**Backend** (requires PostgreSQL running locally):

```bash
cd backend
npm test
```

Runs all integration tests against a `collnotes_test` database (derived automatically from `DATABASE_URL`). Migrations run in `beforeAll`, all tables are cleared in `beforeEach` for full isolation. `fileParallelism: false` prevents FK constraint races between test files.

**Frontend** (no database required — all API calls are intercepted by MSW):

```bash
cd frontend
npm test
```

**52 tests across 9 suites:**

| Suite | Tests | Type |
|---|---|---|
| Backend: auth | 5 | Integration |
| Backend: documents (CRUD, isolation, duplicate, content, activity) | 20 | Integration |
| Backend: versioning (save, list, restore, ownership) | 7 | Integration |
| Backend: sharing (create, resolve, permissions, auth) | 6 | Integration |
| Frontend: LoginForm | 3 | Component |
| Frontend: useDocuments | 2 | Hook |
| Frontend: useVersions | 3 | Hook |
| Frontend: DocumentItem | 6 | Component |
| Frontend: useAuth | 4 | Hook |

---

## CI / GitHub Actions

The pipeline runs on every push and pull request to `main` via `.github/workflows/ci.yml`. Three jobs:

1. **Backend** — spins up a Postgres 17 service container, installs deps, generates Prisma client, TypeScript check, runs all 38 backend tests
2. **Frontend** — installs deps, TypeScript check (`tsc --noEmit`), ESLint (`npm run lint`), runs all 19 frontend tests
3. **Docker** — runs after both pass, builds all three images from `.env.example`

All credentials come from repository secrets — no plaintext values in the workflow file.

**Required GitHub repository secrets** — set under *Settings → Secrets and variables → Actions*:

| Secret | Notes |
|---|---|
| `POSTGRES_USER` | Used by CI Postgres service and assembled into `DATABASE_URL` |
| `POSTGRES_PASSWORD` | Used by CI Postgres service and assembled into `DATABASE_URL` |
| `POSTGRES_DB` | Database name |
| `JWT_SECRET` | Must be at least 32 characters |

---

## Design Decisions

### CRDT over OT for real-time sync

The two main approaches to collaborative editing are Operational Transformation (OT) and CRDTs.

**OT** (used by Google Docs): each operation is transformed against concurrent operations before being applied. Requires the server to coordinate every pair of concurrent edits — O(N²) transform complexity, and correctness depends on getting every transform function right for every operation type combination.

**CRDT** (Conflict-free Replicated Data Type): operations are designed so that any two replicas converge to the same state regardless of the order updates are applied. No server coordination required for merging — the server is just a relay and persistence layer.

**Chosen: Yjs CRDT.** Reasons:
- Mathematical correctness guarantee — no edge cases in transform functions to miss
- Offline support is a natural consequence, not an add-on (state vectors + delta sync)
- The awareness protocol gives presence and cursor sharing for free
- Tiptap has first-class Yjs integration via `@tiptap/extension-collaboration`

**Tradeoff accepted:** Yjs document state grows over time as deleted content is retained as tombstones. Negligible at note-taking scale. For documents with millions of edits, periodic state compaction would be needed.

### Snapshot versioning over operation log

Versions are stored as full Yjs binary snapshots, not an operation log. This means:
- Restore is a single write (copy snapshot bytes back to `Document.content`) rather than replaying a potentially long operation chain
- Storage cost is higher per version, but snapshots are only taken every 5 minutes or on explicit save
- Tradeoff: coarser granularity vs. simpler implementation and faster restore

### Atomic ownership enforcement

All document mutations use Prisma's `updateMany` / `deleteMany` with both `id` and `ownerId` in the `where` clause rather than a separate existence check followed by an update. This prevents TOCTOU (time-of-check/time-of-use) races where a document could be transferred between a check and an update.

### Single nginx entry point

In Docker, the frontend nginx container proxies both `/api` (HTTP) and `/collab` (WebSocket upgrade) to the backend. The frontend talks to one host only — no CORS configuration, no mixed-content issues, and the WebSocket URL is derived from `window.location.host` rather than being hardcoded.

### ESLint as a correctness gate, not just style

ESLint is configured with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`. The rules enforced go beyond formatting:

- `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` catch missing effect dependencies — a common source of stale closure bugs that only appear at runtime under specific timing
- `react-hooks/set-state-in-effect` and `react-hooks/refs` flag patterns that cause cascading renders or incorrect ref reads during render — both of which are silent in TypeScript but cause real behavioural issues in production
- `@typescript-eslint/no-unused-vars` eliminates dead imports and variables that accumulate during development
- `@typescript-eslint/no-explicit-any` pushes toward real type declarations — the `y-websocket` and `y-indexeddb` packages have no bundled types, so a proper `src/types/y-websocket.d.ts` declaration file was created rather than scattering `any` casts throughout the codebase

Running `npm run lint` is part of the CI pipeline alongside `tsc --noEmit`, so type errors and hook violations are caught before a Docker image is ever built.

### Healthcheck-ordered container startup

Docker Compose uses `condition: service_healthy` for all service dependencies. Postgres must pass `pg_isready` before the backend starts; the backend must pass `GET /health` before nginx starts. This eliminates the race condition where the browser loads the SPA before the API is accepting connections.

---

## Built With AI Assistance

**Claude Code (claude-sonnet-4-6)** was used as a pair programmer throughout the project.

**Where it was genuinely useful:**
- Scaffolding the Prisma schema, Express route structure, and React hook patterns — fast to generate, easy to review and adjust
- Explaining the Yjs `setPersistence` hook and `evictRoom` API (y-websocket internals are sparsely documented)
- Generating the Docker Compose configuration and nginx WebSocket proxy config
- Writing the test suites — backend integration tests and frontend MSW-based hook/component tests

**Where it fell short or needed correction:**
- Initial slash command implementation referenced a non-existent `@tiptap/extension-slash-commands` package — replaced with a custom ProseMirror plugin using `tippy.js` for positioning
- Suggested `url = env("DATABASE_URL")` in `schema.prisma` — that is Prisma 5 syntax. Prisma 7 requires the connection string in `prisma.config.ts` and the `PrismaPg` adapter at runtime. This was a non-obvious breaking change that required understanding the Prisma 7 migration guide
- WebSocket authentication for share tokens required custom logic on top of y-websocket's defaults, which the AI initially missed
- AI installed `@tiptap/extension-underline` without pinning the version, which pulled v3 while all other Tiptap packages were v2 — this broke the Docker build with an `ERESOLVE` peer dependency conflict. Fixed by explicitly pinning to `^2.27.2`
- Generated test files had wrong API response field assertions (`documentId` instead of `id`) and used `PUT` instead of `PATCH` for the rename endpoint — caught during review and corrected

**Approach:** AI handled boilerplate-heavy tasks at speed. Architectural decisions, debugging of runtime failures, Prisma 7 migration, and all integration-level correctness were verified and corrected by hand. The AI's output was treated as a draft to review, not a final answer.

---

## Known Trade-offs

These are deliberate design decisions that come from the debounced, dual-path save architecture.

### Up to 500ms before content is persisted to the database

Every edit triggers a 500ms debounced flush on two independent paths:

1. **Frontend** — `PATCH /documents/:id/content` with the full Yjs binary state (owner sessions only, skipped for read-only and share sessions)
2. **Backend WebSocket server** — `setPersistence` fires an `ydoc.on('update')` listener that also debounces at 500ms and writes to `Document.content`

Both paths are intentional. The backend path is the authoritative one (it captures all edits including those from collaborative peers); the frontend path is a belt-and-suspenders flush that ensures the owner's last edit is persisted even if the WebSocket room evicts before the backend timer fires.

If you close the tab within 500ms of the last keystroke, the final update may not reach the database. This is a known tradeoff of debounced auto-save — accepted because the alternative (synchronous write on every keystroke) would produce thousands of writes per minute.

### Shared document may appear blank for ~1 second on first open

When a guest or non-owner opens a shared document, the editor renders immediately with an empty Yjs document and displays a "Loading document…" overlay. The overlay lifts once the WebSocket `synced` event fires — meaning the server has completed the initial state vector exchange and sent all document content to the client.

The delay is typically under 1 second on a local network. It is longer if:
- The document room was idle (server must load from DB before syncing)
- The network round-trip is slow

IndexedDB caching is intentionally disabled for share sessions. Caching an empty state on first visit and replaying it on subsequent visits caused the document to appear blank even after the WebSocket synced — the cached empty state was applied on top of the real content.

### "Shared with me" section only appears after opening a share link

The sidebar's "Shared with me" list is populated by `GET /shared-with-me`, which returns documents whose share tokens have been explicitly saved to the authenticated user's account. A document only appears in this list after the logged-in user opens its share link at least once — the save happens automatically on first open. There is no pre-population from invite.

---

## Roadmap

1. **Redis pub/sub for horizontal scaling** — multiple Node.js instances share document state via a Redis channel rather than an in-process `Map`, enabling the WebSocket server to scale out
2. **Character-level version history** — store the Yjs operation log rather than full snapshots, enabling per-keystroke playback (like Google Docs version history)
3. **Inline comments** — select text, anchor a comment thread, resolve/reopen; stored as Yjs marks so they survive collaborative edits
4. **Full-text search** — PostgreSQL `tsvector` index on document text content, extracted from Yjs state on each save
5. **Document templates** — save any document as a reusable template; new documents can be created pre-populated from a template
