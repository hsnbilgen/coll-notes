# coll-notes — Claude Instructions

Real-time collaborative note-taking app built as a job interview assignment.

## Stack

**Backend** (`/backend`) — Node 22, Express 4, Prisma 7, PostgreSQL 17, y-websocket, JWT auth  
**Frontend** (`/frontend`) — React 18, Vite, Tiptap 2 + Yjs, TanStack Query v5, shadcn/ui, Tailwind  
**Infra** — Docker Compose (`name: coll-notes`), three services: postgres, backend, frontend

## Prisma 7 — Critical Config

Prisma 7 no longer allows `url` in `schema.prisma`. Connection config lives in two places:

- **`backend/prisma.config.ts`** — Prisma CLI config (used by `prisma migrate`, `prisma generate`)
- **`backend/src/lib/prisma.ts`** — Runtime client using `PrismaPg` adapter from `@prisma/adapter-pg`

Never put `url = env("DATABASE_URL")` back in `schema.prisma` — that's Prisma 5 syntax and will break.

When running migrations locally: `cd backend && DATABASE_URL=<url> ./node_modules/.bin/prisma migrate deploy`

## Running the Stack

```bash
# Full stack (Docker)
docker compose up -d

# Backend dev (local)
cd backend && npm run dev

# Frontend dev (local)
cd frontend && npm run dev
```

Ports:
- `5173` — React frontend (nginx in Docker, Vite in dev)
- `3001` — Express REST API
- `3002` — y-websocket real-time server
- `5432` — PostgreSQL

## Environment

Root `.env` is the source of truth for Docker Compose.  
`backend/.env` is for local dev only — it is excluded from Docker builds via `.dockerignore`.

Never commit real secrets. `JWT_SECRET` defaults to `dev-secret-change-in-production` in dev.

## Architecture Decisions

- **CRDT via Yjs** — conflict-free real-time sync; y-websocket manages rooms; y-indexeddb for offline
- **Tiptap 2** — block editor with Collaboration + CollaborationCursor extensions wired to Yjs
- **SlashCommands** — custom ProseMirror Extension (no npm package); uses tippy.js for positioning
- **Soft delete** — `isDeleted` + `deletedAt` flags; trash list with restore
- **Snapshot versioning** — Yjs binary state stored as `Bytes` in `DocumentVersion`, every 5 min or Cmd+S
- **Share tokens** — UUID in `DocumentShare`, `READ_ONLY` or `EDITABLE` permission
- **Focus mode** — Cmd+Shift+F, sidebar hidden, content centered at 680px, persisted to localStorage
- **Atomic ownership checks** — `updateMany` with `ownerId` in `where` clause prevents TOCTOU races

## Testing

```bash
# Backend tests (requires local Postgres)
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

Backend tests run against a separate `collnotes_test` database (derived from `DATABASE_URL`).  
`fileParallelism: false` in `vitest.config.ts` prevents FK constraint violations from concurrent files.

## Docker Notes

- `node:22-alpine` — Node 26 doesn't exist on Docker Hub
- Backend Dockerfile installs `openssl` (required by Prisma engine on Alpine)
- `prisma.config.ts` is copied into both builder and runtime stages
- Frontend uses `npm install --prefer-offline` (not `npm ci`) due to lock file picomatch mismatch
