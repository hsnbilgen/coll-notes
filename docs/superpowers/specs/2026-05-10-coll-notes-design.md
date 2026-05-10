# coll-notes — Design Spec
**Date:** 2026-05-10  
**Status:** Approved

---

## Overview

A real-time collaborative note-taking application inspired by Notion. Users get private workspaces, a block-based rich text editor with slash commands, real-time multi-user collaboration with presence indicators, document versioning with restore, shareable document links, and a distraction-free focus mode.

Built with Node.js + Express + PostgreSQL on the backend, React + Tiptap + Yjs on the frontend, deployed via Docker Compose as a monorepo.

---

## Architecture

### Monorepo Structure

```
coll-notes/
├── backend/          # Node.js + Express + TypeScript
├── frontend/         # React + TypeScript + Vite
├── docker-compose.yml
└── README.md
```

### Services

| Service | Port | Purpose |
|---|---|---|
| Frontend (Vite) | 5173 | React SPA |
| Backend HTTP | 3001 | REST API |
| Backend WebSocket | 3002 | y-websocket real-time sync |
| PostgreSQL | 5432 | Primary database |

### Backend Stack
- Node.js + Express + TypeScript
- Prisma ORM → PostgreSQL
- `y-websocket` server for real-time sync
- `jsonwebtoken` + `bcrypt` for auth

### Frontend Stack
- React + TypeScript + Vite
- Tiptap editor with Yjs collaboration extension
- shadcn/ui + Tailwind CSS
- TanStack Query for REST API state management

---

## Real-time Collaboration Strategy

**Chosen approach: CRDT via Yjs**

Yjs is a production-grade CRDT implementation used by Notion, Linear, and others. It guarantees conflict-free merging of concurrent edits without server-side transform coordination — the key limitation of Operational Transformation (OT).

**Why CRDT over OT:**
- OT requires the server to transform every operation pair — O(N²) complexity as concurrent ops grow
- CRDT merges are commutative and associative — order doesn't matter, result is always consistent
- Yjs's Tiptap integration is first-class and battle-tested
- Offline support comes for free — Yjs queues local ops and syncs on reconnect

**Why Yjs over hand-rolling:**
- Correctness in CRDT implementation requires careful handling of deletion tombstones, vector clocks, and state vectors — a solved problem not worth re-solving in an 8-hour timebox
- `y-websocket` provides the WebSocket server, room management, and persistence hooks out of the box

**Horizontal scaling path (documented, not implemented):**
When running multiple Node.js instances behind a load balancer, add Redis pub/sub as the Yjs provider backend. Each server subscribes to document room channels — edits from any server fan out to all connected clients. Not needed for single-server deployment.

---

## Data Models

```prisma
model User {
  id           String     @id @default(uuid())
  email        String     @unique
  name         String
  passwordHash String
  createdAt    DateTime   @default(now())
  documents    Document[]
}

model Document {
  id        String    @id @default(uuid())
  title     String    @default("Untitled")
  content   Bytes?    // Yjs binary state vector
  ownerId   String
  owner     User      @relation(fields: [ownerId], references: [id])
  isDeleted Boolean   @default(false)
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  versions  DocumentVersion[]
  shares    DocumentShare[]
}

model DocumentVersion {
  id         String   @id @default(uuid())
  documentId String
  document   Document @relation(fields: [documentId], references: [id])
  content    Bytes    // full Yjs snapshot at this point in time
  createdAt  DateTime @default(now())
}

model DocumentShare {
  id         String          @id @default(uuid())
  documentId String
  document   Document        @relation(fields: [documentId], references: [id])
  token      String          @unique @default(uuid())
  permission SharePermission @default(READ_ONLY)
  createdAt  DateTime        @default(now())
  expiresAt  DateTime?
}

enum SharePermission {
  READ_ONLY
  EDITABLE
}
```

---

## API Routes

### Auth
```
POST /api/auth/register    { email, password, name } → { token, user }
POST /api/auth/login       { email, password } → { token, user }
```

### Documents (JWT required)
```
GET    /api/documents                        → Document[]
POST   /api/documents                        → Document
PATCH  /api/documents/:id                    { title } → Document
DELETE /api/documents/:id                    → soft delete
POST   /api/documents/:id/restore            → Document
```

### Versions (JWT required)
```
GET  /api/documents/:id/versions             → DocumentVersion[]
POST /api/documents/:id/versions/:vid/restore → Document
```

### Sharing (JWT required to create, public to resolve)
```
POST /api/documents/:id/share    { permission, expiresAt? } → { token, url }
GET  /api/share/:token           → { document, permission } (public)
```

---

## WebSocket Protocol (y-websocket)

`y-websocket` handles its own binary protocol — no custom message format needed. Each document gets a room keyed by `documentId`. The server:

1. Authenticates the connection via JWT query param: `ws://localhost:3002?token=<jwt>&documentId=<id>`
2. Verifies the user owns or has share access to the document
3. Syncs the Yjs document state to the new client
4. Broadcasts all subsequent updates to room members

**Presence** is handled via Yjs Awareness — each client broadcasts cursor position, user name, and color. All connected clients receive presence updates without any custom server logic.

**Offline support** — Yjs IndexedDB persistence on the client queues all local edits while disconnected. On reconnect, the client syncs its local state vector with the server and merges cleanly.

---

## Backend Structure

```
backend/src/
├── routes/
│   ├── auth.ts              # POST /register, /login
│   ├── documents.ts         # CRUD + soft delete + restore
│   ├── versions.ts          # list versions + restore to version
│   └── sharing.ts           # create share token, resolve public token
├── middleware/
│   ├── auth.ts              # JWT verification, injects req.user
│   └── errorHandler.ts      # global error handler, consistent error shape
├── services/
│   ├── auth.service.ts      # bcrypt hashing, JWT sign/verify
│   ├── document.service.ts  # document CRUD, soft delete, Yjs snapshot persistence
│   ├── version.service.ts   # snapshot writes, version list, restore
│   └── share.service.ts     # token generation, permission resolution
├── websocket/
│   └── server.ts            # y-websocket setup, JWT + share token auth on connect
├── lib/
│   └── prisma.ts            # Prisma client singleton
├── app.ts                   # Express setup, middleware, route registration
└── server.ts                # starts HTTP (3001) + WebSocket (3002) in one process
```

**Key conventions:**
- Routes are thin: Zod validation → call service → return response
- Services own all business logic and Prisma queries — routes never touch Prisma directly
- WebSocket server is isolated in `websocket/` — completely separate from REST concerns
- `errorHandler.ts` catches all thrown errors and returns consistent `{ error, message }` shape

---

## Frontend Structure

```
frontend/src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── DocumentList.tsx
│   │   ├── DocumentItem.tsx
│   │   └── TrashList.tsx
│   ├── editor/
│   │   ├── Editor.tsx              # Tiptap + Yjs core
│   │   ├── SlashCommands.tsx       # /heading /code /bullet /meeting /decision
│   │   ├── EditorToolbar.tsx
│   │   └── PresenceAvatars.tsx     # online users with colored cursors
│   ├── versions/
│   │   ├── VersionHistoryPanel.tsx
│   │   └── VersionItem.tsx
│   └── sharing/
│       └── ShareDialog.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useDocuments.ts             # TanStack Query CRUD
│   ├── useVersions.ts              # TanStack Query versions
│   └── useCollabEditor.ts          # Yjs + WebSocket setup, awareness
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── WorkspacePage.tsx           # app shell: sidebar + editor
│   ├── DocumentPage.tsx            # editor view
│   └── SharedDocumentPage.tsx      # public share token, read-only or editable
├── lib/
│   ├── api.ts                      # axios instance + JWT interceptor
│   └── auth.ts                     # JWT storage + decode helpers
└── App.tsx
```

---

## Key Features

### Slash Commands
Tiptap's `@tiptap/extension-slash-commands` triggers on `/`. Supported commands:
- `/heading` → H1, H2, H3
- `/bullet` → bullet list
- `/code` → code block
- `/meeting` → template: Attendees / Agenda / Action Items
- `/decision` → template: Context / Decision / Consequences

### Auto-save with Debounce
Tiptap's `onUpdate` debounced 1500ms → PATCH `/api/documents/:id` with Yjs binary state. Also triggers a `DocumentVersion` snapshot write every 5 minutes or on explicit manual save (Cmd+S).

### Version History
Sidebar panel lists versions by timestamp. Clicking a version renders it in a read-only preview pane. "Restore this version" button sends POST to restore endpoint, overwrites the live document content, and creates a new version entry for the restore point.

### Document Sharing
ShareDialog generates a token via POST. Returns a full URL: `http://localhost:5173/share/:token`. Read-only links render `SharedDocumentPage` with Tiptap in non-editable mode. Editable links connect to the Yjs WebSocket room with full collaboration.

### Focus Mode
`Cmd+Shift+F` toggles focus mode: sidebar hidden, toolbar hidden, content centered at 680px max-width, subtle fade transition. State stored in React context, persisted to localStorage. Exit via same shortcut or Escape.

---

## Docker Compose

```yaml
services:
  postgres:   image postgres:17, port 5432
  backend:    builds ./backend, ports 3001+3002, depends on postgres
  frontend:   builds ./frontend, port 5173, depends on backend
```

Single `docker-compose up` starts the full stack. Backend runs HTTP and WebSocket servers in one Node.js process.

---

## README Sections

1. What it is and what it does
2. Tech stack and why each choice was made
3. Architecture diagram (ASCII)
4. Local setup: `docker-compose up`
5. Manual setup (without Docker)
6. Real-time sync approach: CRDT/Yjs explanation and tradeoffs vs OT
7. AI tools used, where helpful, where corrected
8. What would be built next given more time (Redis pub/sub, operation log versioning, inline comments)

---

## Out of Scope (documented as next steps)

- Redis pub/sub for horizontal WebSocket scaling
- Operation-log versioning (Google Docs-style granular history)
- Inline comments / annotation threads
- AI document summary
- Email notifications
