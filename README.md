# coll-notes

A real-time collaborative note-taking application built as a full-stack engineering assignment. Multiple users can edit the same document simultaneously — edits merge without conflicts, cursors appear live, and the full version history is always one click away.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [How It Works](#how-it-works)
4. [Quick Start with Docker](#quick-start-with-docker)
5. [Manual Setup](#manual-setup)
6. [Running Tests](#running-tests)
7. [Design Decisions](#design-decisions)
8. [AI Tools Used](#ai-tools-used)
9. [What I'd Build Next](#what-id-build-next)

---

## Features

| Feature | Details |
|---|---|
| Rich text editor | Headings, lists, code blocks, blockquotes, slash commands (`/`) |
| Real-time collaboration | Multiple users edit simultaneously, changes merge instantly |
| Live presence | Colored cursors in the document, avatar stack in the toolbar |
| Offline support | Edits persist locally in IndexedDB, sync automatically on reconnect |
| Version history | Auto-snapshot every 5 minutes, restore any previous version |
| Document sharing | Generate read-only or editable shareable links |
| Activity feed | Real-time "who's here" + edit history timeline per document |
| User workspaces | Each user's documents are fully isolated via JWT auth |
| Soft delete / trash | Documents go to trash, can be restored or stay deleted |
| Focus mode | Distraction-free writing (⌘⇧F), centered 680px column |
| Duplicate document | Copy any document with its full content |

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
| Testing | Vitest + Supertest | — |

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
   │   /api  →  backend:3001             │
   │   /collab → backend:3002 (WS)       │
   └─────────────────┬───────────────────┘
                     │
   ┌─────────────────▼───────────────────┐
   │         Express API (port 3001)      │
   │  /api/auth      register, login      │
   │  /api/documents CRUD, share, content │
   │  /api/documents/:id/versions         │
   │  /api/share/:token   resolve share   │
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
   │  DocumentShare                       │
   └─────────────────────────────────────┘
```

### Real-time Collaboration Flow

1. When a user opens a document, the frontend creates a `Y.Doc` (Yjs document) and connects a `WebsocketProvider` to `wss://<host>/collab` with the `documentId` as the room name and the user's JWT as a query parameter.
2. The backend WebSocket server authenticates the connection (JWT owner check or valid share token), then calls `setupWSConnection` from `y-websocket` which handles the full Yjs sync protocol — exchanging state vectors and broadcasting updates between all clients in the room.
3. Tiptap's `Collaboration` extension binds its document state directly to the `Y.Doc`. Every keystroke produces a Yjs update that is broadcast to all other clients and applied to their local `Y.Doc` in real time.
4. On the server, `setPersistence` wires Postgres as the storage layer: when a room first opens, the saved Yjs binary is loaded into the in-memory doc; every update is debounced and flushed to the `Document.content` column; when the last client disconnects, a final flush runs.
5. `CollaborationCursor` and the Yjs awareness protocol handle presence: each client broadcasts its cursor position and user info (name, colour); other clients render the cursor directly in the ProseMirror document.

### Offline Support

`y-indexeddb` creates a second persistence layer in the browser. Edits made while the WebSocket is down are written to IndexedDB immediately. On reconnect, Yjs performs a state vector exchange — the server sends only the updates the client missed, the client sends its queued offline edits. Merges are always conflict-free because Yjs is a CRDT.

### Authentication & Workspace Isolation

- Registration hashes the password with bcrypt (12 rounds) and returns a signed JWT.
- Every protected API route runs `requireAuth` middleware which verifies the JWT and attaches `req.user`.
- Every database query for documents includes `ownerId: req.user.id` in the `where` clause. A user cannot read, modify, or delete another user's document — the response is always 404 (not 403, to avoid confirming existence).
- WebSocket connections require a valid JWT or an `EDITABLE` share token. `READ_ONLY` share tokens are rejected at the WebSocket level.

### Document Versioning

The frontend snapshots the full Yjs binary state every 5 minutes and posts it to `POST /documents/:id/versions`. Each snapshot is stored as a `DocumentVersion` row. On restore, the chosen snapshot's binary is written back to `Document.content`, the in-memory Yjs room is evicted (`evictRoom`), and the frontend remounts the editor — so the next WebSocket connection loads the restored state cleanly from the database.

---

## Quick Start with Docker

**Prerequisites:** Docker and Docker Compose installed.

```bash
git clone <repo-url>
cd coll-notes

# Copy the env template and review the values
cp .env.example .env

# Start all three containers (postgres, backend, frontend)
docker compose up --build
```

Open [http://localhost:5173](http://localhost:5173). Register an account and start writing.

**To test real-time collaboration:** open the app in two browser windows with different accounts. Share a document using the Share button (top right), open the link in the second window. Both cursors and edits will appear live.

**Environment variables** (`.env` at project root):

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_USER` | PostgreSQL user | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_DB` | Database name | `collnotes` |
| `DATABASE_URL` | Full connection string (must match above) | see `.env.example` |
| `JWT_SECRET` | Secret for signing JWTs — **change in production** | `dev-secret-change-in-production` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `FRONTEND_URL` | Used to construct share link URLs | `http://localhost:5173` |

---

## Manual Setup

Requires Node.js 22+ and PostgreSQL 17 running locally.

**Backend:**

```bash
cd backend
cp .env.example .env        # set DATABASE_URL to your local postgres
npm install
./node_modules/.bin/prisma migrate deploy
npm run dev                 # starts REST API on :3001 and WS server on :3002
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev                 # starts Vite dev server on :5173
```

The frontend proxies `/api` and `/collab` via Vite's dev proxy — no nginx needed locally.

---

## Running Tests

**Backend** (requires PostgreSQL running locally):

```bash
cd backend
npm test        # runs all 33 integration tests against collnotes_test DB
```

The test setup derives the test DB URL from `DATABASE_URL` in `backend/.env` (replaces `/collnotes` with `/collnotes_test`), runs migrations in `beforeAll`, and clears all tables in `beforeEach` for full isolation. `fileParallelism: false` prevents FK constraint races between test files.

**Frontend** (no DB required — all API calls are intercepted by MSW):

```bash
cd frontend
npm test        # runs all 19 component and hook tests
```

**Coverage: 52 tests total**

| Suite | Tests |
|---|---|
| Backend: auth | 5 |
| Backend: documents (CRUD, isolation, duplicate, content, activity) | 20 |
| Backend: versioning (save, list, restore, ownership) | 7 |
| Backend: sharing (create, resolve, permissions, auth) | 6 |
| Frontend: LoginForm | 3 |
| Frontend: useDocuments | 2 |
| Frontend: useVersions | 3 |
| Frontend: DocumentItem | 6 |
| Frontend: useAuth | 4 |

## CI / GitHub Actions

The CI pipeline runs on every push and pull request to `main` via `.github/workflows/ci.yml`. It has three jobs:

1. **Backend** — spins up a Postgres 17 service container, installs deps, generates Prisma client, TypeScript check, runs all 33 tests
2. **Frontend** — installs deps, TypeScript check, runs all 19 tests
3. **Docker** — runs after both pass, builds all three images from `.env.example`

**Required GitHub repository secrets** — set these under *Settings → Secrets and variables → Actions*:

| Secret | Example value | Notes |
|---|---|---|
| `POSTGRES_USER` | `postgres` | Used by CI Postgres service and `DATABASE_URL` |
| `POSTGRES_PASSWORD` | `strongpassword` | Used by CI Postgres service and `DATABASE_URL` |
| `POSTGRES_DB` | `collnotes` | Database name |
| `JWT_SECRET` | `long-random-string` | Must be at least 32 characters |

The `DATABASE_URL` is assembled from the above secrets inside the workflow — no connection string is stored as a secret directly.

---

## Design Decisions

### CRDT over OT for real-time sync

The two main approaches to collaborative editing are Operational Transformation (OT) and CRDTs.

**OT** (used by Google Docs, SharePoint): each operation is transformed against concurrent operations before being applied. Requires the server to coordinate every pair of concurrent edits - O(N²) transform complexity, and correctness depends on getting every transform function right for every operation type combination.

**CRDT** (Conflict-free Replicated Data Type): operations are designed so that any two replicas converge to the same state regardless of the order updates are applied. No server coordination required for merging - the server is just a relay and persistence layer.

**Chosen approach: Yjs CRDT.** Reasons:
- Mathematical correctness guarantee — no edge cases in transform functions to miss
- Offline support is a natural consequence, not an add-on (state vectors + delta sync)
- Yjs awareness protocol gives presence/cursor sharing for free
- Tiptap (the editor) has first-class Yjs integration via `@tiptap/extension-collaboration`
- Used in production by Notion, Linear, and Figma

**Tradeoff accepted:** Yjs document state grows over time as deleted content is retained as tombstones. This is negligible at note-taking scale. For a document with millions of edits, periodic state compaction would be needed.

### Snapshot versioning over operation log

Versions are stored as full Yjs binary snapshots, not an operation log. This means:
- Restore is a single write (copy snapshot bytes back to `Document.content`) rather than replaying a potentially long operation chain
- Storage cost is higher per version, but snapshots are only taken every 5 minutes
- The tradeoff is coarser granularity (5-minute intervals) vs. character-level history

### Atomic ownership enforcement

All document mutations use Prisma's `updateMany` with both `id` and `ownerId` in the `where` clause rather than a separate existence check followed by an update. This prevents TOCTOU (time-of-check/time-of-use) races where a document could be transferred between a check and an update.

### Single nginx entry point

In Docker, the frontend nginx container proxies both `/api` (HTTP) and `/collab` (WebSocket upgrade) to the backend. This means the frontend only ever talks to one host — no CORS configuration, no mixed-content issues, and the WebSocket URL is derived from `window.location.host` rather than being hardcoded.

---

## AI Tools Used

**Claude Code (claude-sonnet-4-6)** was used throughout this project.

**Where it was genuinely useful:**
- Scaffolding the Prisma schema, Express route structure, and React hook patterns - fast to generate, easy to review
- Explaining the Yjs awareness API and `setPersistence` hook (y-websocket internals are sparsely documented)
- Generating the Docker Compose configuration and nginx WebSocket proxy config

**Where it needed correction:**
- Initial slash command implementation used a non-existent `@tiptap/extension-slash-commands` package — replaced with a custom ProseMirror plugin using `tippy.js` for positioning
- Suggested putting `url = env("DATABASE_URL")` in `schema.prisma` which is Prisma 5 syntax; Prisma 7 requires the connection string in `prisma.config.ts` and the `PrismaPg` adapter at runtime
- WebSocket authentication for share tokens required custom logic on top of y-websocket's defaults, which AI initially missed

**Approach:** AI was used as a pair programmer for speed on boilerplate-heavy tasks. All architectural decisions, debugging of runtime failures, and integration of Prisma 7's breaking changes were done by hand.

---

## What I'd Build Next

1. **Redis pub/sub** - horizontal WebSocket scaling: multiple Node.js instances share document state via a Redis channel rather than an in-process `Map`
2. **Character-level version history** — store the Yjs operation log rather than full snapshots, enabling Google Docs-style per-keystroke playback
3. **Inline comments** - select text, anchor a comment thread, resolve/reopen comments; stored as Yjs marks to survive collaborative edits
4. **Full-text search** - PostgreSQL `tsvector` index on document text content, extracted from Yjs state on save
5. **Document templates** - save any document as a reusable template; new documents can be created from a template
