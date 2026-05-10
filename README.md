# coll-notes

A real-time collaborative note-taking application. Multiple users can edit the same document simultaneously with conflict-free merging, presence indicators, and a full version history.

## Features

- **Block-based editor** — headings, bullet lists, code blocks, slash commands (`/heading`, `/code`, `/meeting`, `/decision`)
- **Real-time collaboration** — multiple users, live cursors, presence avatars
- **Conflict-free sync** — CRDT via Yjs; concurrent edits always merge correctly
- **Offline support** — edits queue locally (IndexedDB), sync on reconnect
- **Document versioning** — auto-snapshot every 5 minutes, restore any version
- **Document sharing** — shareable read-only or editable links
- **Focus mode** — distraction-free writing (⌘⇧F)
- **User workspaces** — JWT auth, documents are owner-isolated

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Node.js + Express + TypeScript | Familiar, minimal overhead |
| Database | PostgreSQL + Prisma | Relational, type-safe queries |
| Real-time | Yjs + y-websocket | Production CRDT, Tiptap first-class support |
| Editor | Tiptap 2 | Best Yjs integration, extensible |
| Frontend | React 18 + Vite | Fast DX, modern tooling |
| UI | shadcn/ui + Tailwind | Accessible components, utility-first styling |
| Data fetching | TanStack Query v5 | Client-side cache, optimistic updates |

## Architecture

```
┌──────────────┐     REST (3001)     ┌─────────────────────┐
│   React SPA  │ ←────────────────→  │   Express API        │
│   (port 5173)│                     │   auth / documents   │
│              │     WS (3002)       │   versions / sharing │
│              │ ←────────────────→  │                      │
└──────────────┘     y-websocket     │   y-websocket server │
                                     └──────────┬──────────┘
                                                │
                                     ┌──────────▼──────────┐
                                     │      PostgreSQL      │
                                     │      (port 5432)     │
                                     └─────────────────────┘
```

## Real-time Sync: Why CRDT over OT

Operational Transformation (OT) requires the server to transform every pair of concurrent operations — O(N²) complexity that requires a central coordinating server. CRDTs (Conflict-free Replicated Data Types) are mathematically guaranteed to converge regardless of operation order; merges are commutative and associative.

**Yjs** is the production CRDT implementation used by Notion, Linear, and others. Using it over hand-rolling OT means:
- Correctness guaranteed (no missed edge cases in transform functions)
- Offline support for free (Yjs queues updates, syncs state vectors on reconnect)
- Presence/awareness for free (no custom WebSocket message protocol)

**Horizontal scaling path (not implemented):** Add Redis pub/sub as the Yjs provider backend so multiple Node.js instances share document state. Each WebSocket connection subscribes to a document channel; updates fan out across servers.

## Quick Start (Docker)

```bash
git clone <repo>
cd coll-notes
docker-compose up
```

Open `http://localhost:5173`. Register, create a document, start writing.

To test collaboration: open the app in two browser windows with different accounts, open the same document via a share link.

## Manual Setup

**Backend:**
```bash
cd backend
cp .env.example .env   # edit DATABASE_URL if needed
npm install
npx prisma migrate dev
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Requires PostgreSQL running locally (see `.env.example` for connection string).

## AI Tools Used

**Claude Code (claude-sonnet-4-6)** was used throughout this project for:
- Architecture design and tradeoff analysis (CRDT vs OT vs delta-based)
- Generating boilerplate (Prisma schema, Express routes, React hooks)
- Suggesting the Yjs + Tiptap pairing over a custom WebSocket protocol

**Where AI was helpful:**
- Quickly scaffolding the Prisma schema and service layer pattern
- Explaining Yjs awareness API for presence indicators
- Generating the Docker Compose configuration

**Where AI fell short / was corrected:**
- Initial slash command implementation used a deprecated Tiptap extension API — replaced with a custom ProseMirror plugin approach
- AI suggested `@tiptap/extension-slash-commands` which doesn't exist as a standalone package; implementation was written from scratch
- WebSocket auth for share tokens required custom logic not covered by y-websocket defaults

## What I'd Build Next

1. **Redis pub/sub** — horizontal WebSocket scaling for multi-instance deployments
2. **Operation-log versioning** — character-level history (Google Docs style) instead of 5-minute snapshots
3. **Inline comments** — select text, start a comment thread, resolve comments
4. **Workspace search** — full-text search across all documents using PostgreSQL `tsvector`
5. **Document templates** — save a document as a reusable template
