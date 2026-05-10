# coll-notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time collaborative note-taking app with JWT auth, block-based rich text editor (Tiptap + Yjs), presence indicators, document versioning, shareable links, and focus mode — deployable via `docker-compose up`.

**Architecture:** Monorepo with `backend/` (Express + TypeScript + Prisma + y-websocket) and `frontend/` (React + Vite + Tiptap + shadcn/ui). Backend runs HTTP on port 3001 and WebSocket on port 3002 in one process. PostgreSQL as the database. Yjs handles all real-time sync and conflict resolution via CRDT.

**Tech Stack:** Node.js 20, Express 4, TypeScript 5, Prisma 5, PostgreSQL 17, Yjs, y-websocket, React 18, Vite, Tiptap 2, TanStack Query v5, shadcn/ui, Tailwind CSS 3, Docker Compose

---

## TDD Approach

Every backend route is test-driven: write failing tests first, implement to pass, commit. Frontend components use Vitest + Testing Library for hook and render tests. Tests run against a real test database (same PostgreSQL, separate `collnotes_test` DB) — no mocks for database calls.

**Backend test stack:** Vitest + Supertest + a test DB seeded fresh per test file.
**Frontend test stack:** Vitest + @testing-library/react + msw for API mocking.

---

## File Map

### Backend
| File | Responsibility |
|---|---|
| `backend/package.json` | Dependencies and scripts |
| `backend/tsconfig.json` | TypeScript config |
| `backend/prisma/schema.prisma` | Data models: User, Document, DocumentVersion, DocumentShare |
| `backend/src/lib/prisma.ts` | Prisma singleton |
| `backend/src/middleware/auth.ts` | JWT verification, injects `req.user` |
| `backend/src/middleware/errorHandler.ts` | Global error handler, consistent `{ error, message }` shape |
| `backend/src/services/auth.service.ts` | bcrypt hashing, JWT sign/verify |
| `backend/src/services/document.service.ts` | Document CRUD, soft delete, Yjs snapshot persistence |
| `backend/src/services/version.service.ts` | Snapshot writes, version list, restore |
| `backend/src/services/share.service.ts` | Token generation, permission resolution |
| `backend/src/routes/auth.ts` | POST /api/auth/register, /api/auth/login |
| `backend/src/routes/documents.ts` | GET/POST/PATCH/DELETE /api/documents, POST restore |
| `backend/src/routes/versions.ts` | GET versions, POST restore version |
| `backend/src/test/setup.ts` | Test DB setup/teardown helpers |
| `backend/src/test/auth.test.ts` | Integration tests: register, login, validation |
| `backend/src/test/documents.test.ts` | Integration tests: CRUD, soft delete, restore |
| `backend/src/test/versions.test.ts` | Integration tests: create/list/restore versions |
| `backend/src/test/sharing.test.ts` | Integration tests: create share, resolve token |
| `backend/src/routes/sharing.ts` | POST create share, GET resolve token |
| `backend/src/websocket/server.ts` | y-websocket setup, JWT + share token auth on connect |
| `backend/src/app.ts` | Express setup, middleware, route registration |
| `backend/src/server.ts` | Starts HTTP (3001) + WebSocket (3002) |
| `backend/Dockerfile` | Production image |

### Frontend
| File | Responsibility |
|---|---|
| `frontend/package.json` | Dependencies and scripts |
| `frontend/vite.config.ts` | Vite config with proxy to backend |
| `frontend/tailwind.config.ts` | Tailwind config |
| `frontend/src/lib/api.ts` | Axios instance with JWT interceptor |
| `frontend/src/lib/auth.ts` | JWT storage, decode, current user helpers |
| `frontend/src/hooks/useAuth.ts` | Login, register, logout mutations |
| `frontend/src/hooks/useDocuments.ts` | TanStack Query: list, create, rename, delete, restore |
| `frontend/src/hooks/useVersions.ts` | TanStack Query: list versions, restore version |
| `frontend/src/hooks/useCollabEditor.ts` | Yjs doc, WebSocketProvider, awareness setup |
| `frontend/src/context/FocusContext.tsx` | Focus mode state + localStorage persistence |
| `frontend/src/components/auth/LoginForm.tsx` | Login form with validation |
| `frontend/src/components/auth/RegisterForm.tsx` | Register form with validation |
| `frontend/src/components/sidebar/Sidebar.tsx` | Sidebar shell with new doc button |
| `frontend/src/components/sidebar/DocumentList.tsx` | Active documents list |
| `frontend/src/components/sidebar/DocumentItem.tsx` | Single doc row: rename, delete |
| `frontend/src/components/sidebar/TrashList.tsx` | Deleted documents with restore |
| `frontend/src/components/editor/Editor.tsx` | Tiptap + Yjs core editor |
| `frontend/src/components/editor/SlashCommands.tsx` | Slash command menu extension |
| `frontend/src/components/editor/EditorToolbar.tsx` | Formatting toolbar |
| `frontend/src/components/editor/PresenceAvatars.tsx` | Online user avatars with colored cursors |
| `frontend/src/components/versions/VersionHistoryPanel.tsx` | Version list + preview + restore |
| `frontend/src/components/versions/VersionItem.tsx` | Single version row |
| `frontend/src/components/sharing/ShareDialog.tsx` | Generate + copy share link |
| `frontend/src/pages/LoginPage.tsx` | Login route |
| `frontend/src/pages/RegisterPage.tsx` | Register route |
| `frontend/src/pages/WorkspacePage.tsx` | Main app shell: sidebar + editor |
| `frontend/src/pages/DocumentPage.tsx` | Editor view for a specific document |
| `frontend/src/pages/SharedDocumentPage.tsx` | Public share token view |
| `frontend/src/App.tsx` | Router, auth guard, route definitions |
| `frontend/Dockerfile` | Production image |
| `frontend/src/test/setup.ts` | Testing Library + msw setup |
| `frontend/src/test/useDocuments.test.tsx` | Hook tests: list, create, rename, delete |
| `frontend/src/test/LoginForm.test.tsx` | Component test: form submit, error state |
| `docker-compose.yml` | Full stack: postgres + backend + frontend |

---

## Task 1: Monorepo scaffold and Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/tsconfig.json`

- [ ] **Step 1: Create backend package.json**

```json
{
  "name": "coll-notes-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate deploy",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "ws": "^8.18.0",
    "y-websocket": "^2.1.0",
    "yjs": "^13.6.20",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.0.0",
    "@types/ws": "^8.5.13",
    "prisma": "^5.22.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 2: Create backend tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create backend .env.example**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/collnotes"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
WS_PORT=3002
FRONTEND_URL="http://localhost:5173"
```

- [ ] **Step 4: Create frontend package.json**

```json
{
  "name": "coll-notes-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-scroll-area": "^1.2.2",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.1.6",
    "@tanstack/react-query": "^5.62.7",
    "@tiptap/core": "^2.10.3",
    "@tiptap/extension-collaboration": "^2.10.3",
    "@tiptap/extension-collaboration-cursor": "^2.10.3",
    "@tiptap/extension-code-block": "^2.10.3",
    "@tiptap/extension-bullet-list": "^2.10.3",
    "@tiptap/extension-heading": "^2.10.3",
    "@tiptap/extension-list-item": "^2.10.3",
    "@tiptap/extension-placeholder": "^2.10.3",
    "@tiptap/pm": "^2.10.3",
    "@tiptap/react": "^2.10.3",
    "@tiptap/starter-kit": "^2.10.3",
    "axios": "^1.7.9",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.469.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.1",
    "tailwind-merge": "^2.6.0",
    "y-indexeddb": "^9.0.12",
    "y-websocket": "^2.1.0",
    "yjs": "^13.6.20"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vite": "^6.0.7"
  }
}
```

- [ ] **Step 5: Create frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 6: Create frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 7: Create frontend/tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 8: Create frontend/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>coll-notes</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Create frontend/src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 10: Create frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 11: Create frontend/tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 12: Create frontend/postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 13: Create docker-compose.yml**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: collnotes
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - '3001:3001'
      - '3002:3002'
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/collnotes
      JWT_SECRET: super-secret-jwt-key-change-in-production
      JWT_EXPIRES_IN: 7d
      PORT: 3001
      WS_PORT: 3002
      FRONTEND_URL: http://localhost:5173
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - '5173:80'
    depends_on:
      - backend

volumes:
  postgres_data:
```

- [ ] **Step 14: Create backend/Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
EXPOSE 3001 3002
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

- [ ] **Step 15: Create frontend/Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 16: Create frontend/nginx.conf**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

- [ ] **Step 17: Install backend dependencies**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/backend
npm install
```

- [ ] **Step 18: Install frontend dependencies**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/frontend
npm install
```

- [ ] **Step 19: Commit scaffold**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add .
git commit -m "chore: scaffold monorepo with backend and frontend"
```

---

## Task 2: Prisma schema and database setup

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/lib/prisma.ts`

- [ ] **Step 1: Create backend/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String     @id @default(uuid())
  email        String     @unique
  name         String
  passwordHash String
  createdAt    DateTime   @default(now())
  documents    Document[]
}

model Document {
  id        String            @id @default(uuid())
  title     String            @default("Untitled")
  content   Bytes?
  ownerId   String
  owner     User              @relation(fields: [ownerId], references: [id])
  isDeleted Boolean           @default(false)
  deletedAt DateTime?
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
  versions  DocumentVersion[]
  shares    DocumentShare[]
}

model DocumentVersion {
  id         String   @id @default(uuid())
  documentId String
  document   Document @relation(fields: [documentId], references: [id])
  content    Bytes
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

- [ ] **Step 2: Create backend/src/lib/prisma.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 3: Copy .env.example to .env and start postgres**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/backend
cp .env.example .env
# Edit .env if needed — defaults work for local dev with docker postgres
docker run -d \
  --name collnotes-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=collnotes \
  -p 5432:5432 \
  postgres:17-alpine
```

- [ ] **Step 4: Run migration**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/backend
npx prisma migrate dev --name init
```

Expected: Migration created and applied. `prisma generate` runs automatically.

- [ ] **Step 5: Verify schema in Prisma Studio (optional)**

```bash
npx prisma studio
```

Open `http://localhost:5555` — verify User, Document, DocumentVersion, DocumentShare tables exist.

- [ ] **Step 6: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add backend/prisma backend/src/lib
git commit -m "feat: add Prisma schema with User, Document, DocumentVersion, DocumentShare"
```

---

## Task 2b: Backend test infrastructure and failing tests (TDD)

**Files:**
- Create: `backend/vitest.config.ts`
- Create: `backend/src/test/setup.ts`
- Create: `backend/src/test/auth.test.ts`
- Create: `backend/src/test/documents.test.ts`
- Modify: `backend/package.json` (add test script and dev deps)

- [ ] **Step 1: Add Vitest and Supertest to backend devDependencies**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/backend
npm install -D vitest supertest @types/supertest
```

- [ ] **Step 2: Create backend/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
})
```

- [ ] **Step 3: Add test scripts to backend/package.json scripts section**

Add to the `"scripts"` block:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create backend/src/test/setup.ts**

```typescript
import { execFileSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const TEST_DATABASE_URL = process.env.DATABASE_URL!.replace('/collnotes', '/collnotes_test')

process.env.DATABASE_URL = TEST_DATABASE_URL
process.env.JWT_SECRET = 'test-secret'
process.env.JWT_EXPIRES_IN = '1h'
process.env.FRONTEND_URL = 'http://localhost:5173'

export const testPrisma = new PrismaClient({
  datasources: { db: { url: TEST_DATABASE_URL } },
})

beforeAll(async () => {
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  })
})

beforeEach(async () => {
  await testPrisma.documentShare.deleteMany()
  await testPrisma.documentVersion.deleteMany()
  await testPrisma.document.deleteMany()
  await testPrisma.user.deleteMany()
})

afterAll(async () => {
  await testPrisma.$disconnect()
})
```

- [ ] **Step 5: Create backend/src/test/auth.test.ts with failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app'

describe('POST /api/auth/register', () => {
  it('creates a user and returns token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('test@example.com')
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('returns 409 when email already exists', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'dupe@example.com',
      password: 'password123',
      name: 'First',
    })
    const res = await request(app).post('/api/auth/register').send({
      email: 'dupe@example.com',
      password: 'password123',
      name: 'Second',
    })
    expect(res.status).toBe(409)
  })

  it('rejects short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'bad@example.com',
      password: 'short',
      name: 'User',
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})

describe('POST /api/auth/login', () => {
  it('returns token for valid credentials', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'login@example.com',
      password: 'password123',
      name: 'Login User',
    })
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('returns 401 for wrong password', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'wrong@example.com',
      password: 'password123',
      name: 'User',
    })
    const res = await request(app).post('/api/auth/login').send({
      email: 'wrong@example.com',
      password: 'wrongpassword',
    })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 6: Create backend/src/test/documents.test.ts with failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app'

async function registerAndGetToken(email = 'doc@example.com') {
  const res = await request(app).post('/api/auth/register').send({
    email,
    password: 'password123',
    name: 'Doc User',
  })
  return res.body.token as string
}

describe('Document CRUD', () => {
  it('creates a document', async () => {
    const token = await registerAndGetToken()
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.title).toBe('Untitled')
  })

  it('lists only own documents', async () => {
    const token1 = await registerAndGetToken('user1@example.com')
    const token2 = await registerAndGetToken('user2@example.com')
    await request(app).post('/api/documents').set('Authorization', `Bearer ${token1}`)
    await request(app).post('/api/documents').set('Authorization', `Bearer ${token1}`)
    await request(app).post('/api/documents').set('Authorization', `Bearer ${token2}`)
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${token1}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('renames a document', async () => {
    const token = await registerAndGetToken()
    const create = await request(app).post('/api/documents').set('Authorization', `Bearer ${token}`)
    const id = create.body.id
    const res = await request(app)
      .patch(`/api/documents/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Note' })
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('My Note')
  })

  it('soft deletes and hides from list', async () => {
    const token = await registerAndGetToken()
    const create = await request(app).post('/api/documents').set('Authorization', `Bearer ${token}`)
    const id = create.body.id
    await request(app).delete(`/api/documents/${id}`).set('Authorization', `Bearer ${token}`)
    const list = await request(app).get('/api/documents').set('Authorization', `Bearer ${token}`)
    expect(list.body).toHaveLength(0)
    const trash = await request(app).get('/api/documents/trash').set('Authorization', `Bearer ${token}`)
    expect(trash.body).toHaveLength(1)
  })

  it('restores a soft-deleted document', async () => {
    const token = await registerAndGetToken()
    const create = await request(app).post('/api/documents').set('Authorization', `Bearer ${token}`)
    const id = create.body.id
    await request(app).delete(`/api/documents/${id}`).set('Authorization', `Bearer ${token}`)
    await request(app).post(`/api/documents/${id}/restore`).set('Authorization', `Bearer ${token}`)
    const list = await request(app).get('/api/documents').set('Authorization', `Bearer ${token}`)
    expect(list.body).toHaveLength(1)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/documents')
    expect(res.status).toBe(401)
  })

  it('cannot access another user document', async () => {
    const token1 = await registerAndGetToken('owner@example.com')
    const token2 = await registerAndGetToken('other@example.com')
    const create = await request(app).post('/api/documents').set('Authorization', `Bearer ${token1}`)
    const id = create.body.id
    const res = await request(app)
      .patch(`/api/documents/${id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Stolen' })
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 7: Run tests — verify they all FAIL (routes not implemented yet)**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/backend
# Create test DB first
psql -U postgres -c "CREATE DATABASE collnotes_test;" 2>/dev/null || true
npm test
```

Expected: All tests fail with errors like `Cannot find module '../app'` or connection errors. This is correct — red phase of TDD.

- [ ] **Step 8: Commit failing tests**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add backend/vitest.config.ts backend/src/test
git commit -m "test: add failing integration tests for auth and document routes (TDD red phase)"
```

---

## Task 3: Express app foundation and middleware

**Files:**
- Create: `backend/src/middleware/errorHandler.ts`
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`

- [ ] **Step 1: Create backend/src/middleware/errorHandler.ts**

```typescript
import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
```

- [ ] **Step 2: Create backend/src/middleware/auth.ts**

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler'

export interface AuthRequest extends Request {
  user?: { id: string; email: string }
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Unauthorized'))
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string }
    req.user = payload
    next()
  } catch {
    next(new AppError(401, 'Invalid token'))
  }
}
```

- [ ] **Step 3: Create backend/src/app.ts**

```typescript
import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import documentRoutes from './routes/documents'
import versionRoutes from './routes/versions'
import sharingRoutes from './routes/sharing'

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/documents', versionRoutes)
app.use('/api', sharingRoutes)

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use(errorHandler)

export default app
```

- [ ] **Step 4: Create backend/src/server.ts**

```typescript
import 'dotenv/config'
import http from 'http'
import app from './app'
import { setupWebSocketServer } from './websocket/server'

const PORT = parseInt(process.env.PORT || '3001')
const WS_PORT = parseInt(process.env.WS_PORT || '3002')

const httpServer = http.createServer(app)
httpServer.listen(PORT, () => console.log(`HTTP server running on port ${PORT}`))

setupWebSocketServer(WS_PORT)
```

- [ ] **Step 5: Verify app starts**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/backend
# First create a placeholder websocket/server.ts so imports resolve
mkdir -p src/websocket src/routes
echo 'export function setupWebSocketServer(_port: number) {}' > src/websocket/server.ts
echo 'import { Router } from "express"; export default Router()' > src/routes/auth.ts
echo 'import { Router } from "express"; export default Router()' > src/routes/documents.ts
echo 'import { Router } from "express"; export default Router()' > src/routes/versions.ts
echo 'import { Router } from "express"; export default Router()' > src/routes/sharing.ts
npm run dev
```

Expected: `HTTP server running on port 3001`

- [ ] **Step 6: Test health endpoint**

```bash
curl http://localhost:3001/health
```

Expected: `{"ok":true}`

- [ ] **Step 7: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add backend/src
git commit -m "feat: add Express app foundation, auth middleware, error handler"
```

---

## Task 4: Auth service and routes

**Files:**
- Create: `backend/src/services/auth.service.ts`
- Modify: `backend/src/routes/auth.ts`

- [ ] **Step 1: Create backend/src/services/auth.service.ts**

```typescript
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export async function registerUser(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new AppError(409, 'Email already registered')

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
    select: { id: true, email: true, name: true, createdAt: true },
  })

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

  return { token, user }
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new AppError(401, 'Invalid credentials')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AppError(401, 'Invalid credentials')

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
  }
}
```

- [ ] **Step 2: Replace backend/src/routes/auth.ts**

```typescript
import { Router } from 'express'
import { z } from 'zod'
import { registerUser, loginUser } from '../services/auth.service'

const router = Router()

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/register', async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body)
    const result = await registerUser(body.email, body.password, body.name)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body)
    const result = await loginUser(body.email, body.password)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
```

- [ ] **Step 3: Test register**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

Expected: `{"token":"eyJ...","user":{"id":"...","email":"test@example.com","name":"Test User","createdAt":"..."}}`

- [ ] **Step 4: Test login**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected: Same shape as register response.

- [ ] **Step 5: Test validation error**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"short"}'
```

Expected: `{"error":"..."}` with status 500 (Zod throws — that's acceptable for now, errorHandler catches it).

- [ ] **Step 6: Run tests — verify auth tests now PASS**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/backend
npm test -- --reporter=verbose src/test/auth.test.ts
```

Expected: All 5 auth tests pass. Green phase complete for auth.

- [ ] **Step 7: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add backend/src/services/auth.service.ts backend/src/routes/auth.ts
git commit -m "feat: add auth service with register and login endpoints (tests green)"
```

---

## Task 5: Document service and routes

**Files:**
- Create: `backend/src/services/document.service.ts`
- Modify: `backend/src/routes/documents.ts`

- [ ] **Step 1: Create backend/src/services/document.service.ts**

```typescript
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export async function listDocuments(ownerId: string) {
  return prisma.document.findMany({
    where: { ownerId, isDeleted: false },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function listDeletedDocuments(ownerId: string) {
  return prisma.document.findMany({
    where: { ownerId, isDeleted: true },
    select: { id: true, title: true, deletedAt: true },
    orderBy: { deletedAt: 'desc' },
  })
}

export async function createDocument(ownerId: string) {
  return prisma.document.create({
    data: { ownerId, title: 'Untitled' },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })
}

export async function renameDocument(id: string, ownerId: string, title: string) {
  const doc = await prisma.document.findFirst({ where: { id, ownerId, isDeleted: false } })
  if (!doc) throw new AppError(404, 'Document not found')
  return prisma.document.update({
    where: { id },
    data: { title },
    select: { id: true, title: true, updatedAt: true },
  })
}

export async function softDeleteDocument(id: string, ownerId: string) {
  const doc = await prisma.document.findFirst({ where: { id, ownerId, isDeleted: false } })
  if (!doc) throw new AppError(404, 'Document not found')
  return prisma.document.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
    select: { id: true },
  })
}

export async function restoreDocument(id: string, ownerId: string) {
  const doc = await prisma.document.findFirst({ where: { id, ownerId, isDeleted: true } })
  if (!doc) throw new AppError(404, 'Document not found in trash')
  return prisma.document.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
    select: { id: true, title: true, updatedAt: true },
  })
}

export async function saveDocumentContent(id: string, ownerId: string, content: Buffer) {
  const doc = await prisma.document.findFirst({ where: { id, ownerId, isDeleted: false } })
  if (!doc) throw new AppError(404, 'Document not found')
  return prisma.document.update({
    where: { id },
    data: { content, updatedAt: new Date() },
    select: { id: true, updatedAt: true },
  })
}

export async function getDocumentContent(id: string, ownerId: string) {
  const doc = await prisma.document.findFirst({
    where: { id, ownerId, isDeleted: false },
    select: { id: true, title: true, content: true },
  })
  if (!doc) throw new AppError(404, 'Document not found')
  return doc
}
```

- [ ] **Step 2: Replace backend/src/routes/documents.ts**

```typescript
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import {
  listDocuments,
  listDeletedDocuments,
  createDocument,
  renameDocument,
  softDeleteDocument,
  restoreDocument,
} from '../services/document.service'

const router = Router()

router.use(requireAuth)

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const docs = await listDocuments(req.user!.id)
    res.json(docs)
  } catch (err) { next(err) }
})

router.get('/trash', async (req: AuthRequest, res, next) => {
  try {
    const docs = await listDeletedDocuments(req.user!.id)
    res.json(docs)
  } catch (err) { next(err) }
})

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const doc = await createDocument(req.user!.id)
    res.status(201).json(doc)
  } catch (err) { next(err) }
})

router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { title } = z.object({ title: z.string().min(1) }).parse(req.body)
    const doc = await renameDocument(req.params.id, req.user!.id, title)
    res.json(doc)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await softDeleteDocument(req.params.id, req.user!.id)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

router.post('/:id/restore', async (req: AuthRequest, res, next) => {
  try {
    const doc = await restoreDocument(req.params.id, req.user!.id)
    res.json(doc)
  } catch (err) { next(err) }
})

export default router
```

- [ ] **Step 3: Test document CRUD (save JWT from Task 4 login)**

```bash
TOKEN="paste-jwt-here"

# Create
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer $TOKEN"

# List
curl http://localhost:3001/api/documents \
  -H "Authorization: Bearer $TOKEN"

# Rename (use ID from create response)
curl -X PATCH http://localhost:3001/api/documents/<id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Note"}'

# Delete
curl -X DELETE http://localhost:3001/api/documents/<id> \
  -H "Authorization: Bearer $TOKEN"

# Restore
curl -X POST http://localhost:3001/api/documents/<id>/restore \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Each returns appropriate JSON shape with correct status codes.

- [ ] **Step 4: Run tests — verify document tests now PASS**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/backend
npm test -- --reporter=verbose src/test/documents.test.ts
```

Expected: All 7 document tests pass. Green phase complete for documents.

- [ ] **Step 5: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add backend/src/services/document.service.ts backend/src/routes/documents.ts
git commit -m "feat: add document CRUD with soft delete and restore (tests green)"
```

---

## Task 6: Version service and routes

**Files:**
- Create: `backend/src/services/version.service.ts`
- Modify: `backend/src/routes/versions.ts`

- [ ] **Step 1: Create backend/src/services/version.service.ts**

```typescript
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export async function createVersion(documentId: string, content: Buffer) {
  return prisma.documentVersion.create({
    data: { documentId, content },
    select: { id: true, documentId: true, createdAt: true },
  })
}

export async function listVersions(documentId: string, ownerId: string) {
  const doc = await prisma.document.findFirst({ where: { id: documentId, ownerId, isDeleted: false } })
  if (!doc) throw new AppError(404, 'Document not found')

  return prisma.documentVersion.findMany({
    where: { documentId },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function restoreVersion(documentId: string, versionId: string, ownerId: string) {
  const doc = await prisma.document.findFirst({ where: { id: documentId, ownerId, isDeleted: false } })
  if (!doc) throw new AppError(404, 'Document not found')

  const version = await prisma.documentVersion.findFirst({
    where: { id: versionId, documentId },
  })
  if (!version) throw new AppError(404, 'Version not found')

  await prisma.document.update({
    where: { id: documentId },
    data: { content: version.content, updatedAt: new Date() },
  })

  await prisma.documentVersion.create({
    data: { documentId, content: version.content },
  })

  return { id: documentId, restoredFromVersion: versionId }
}
```

- [ ] **Step 2: Replace backend/src/routes/versions.ts**

```typescript
import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { listVersions, restoreVersion } from '../services/version.service'

const router = Router()

router.use(requireAuth)

router.get('/:id/versions', async (req: AuthRequest, res, next) => {
  try {
    const versions = await listVersions(req.params.id, req.user!.id)
    res.json(versions)
  } catch (err) { next(err) }
})

router.post('/:id/versions/:vid/restore', async (req: AuthRequest, res, next) => {
  try {
    const result = await restoreVersion(req.params.id, req.params.vid, req.user!.id)
    res.json(result)
  } catch (err) { next(err) }
})

export default router
```

- [ ] **Step 3: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add backend/src/services/version.service.ts backend/src/routes/versions.ts
git commit -m "feat: add document versioning with list and restore"
```

---

## Task 7: Share service and routes

**Files:**
- Create: `backend/src/services/share.service.ts`
- Modify: `backend/src/routes/sharing.ts`

- [ ] **Step 1: Create backend/src/services/share.service.ts**

```typescript
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { SharePermission } from '@prisma/client'

export async function createShare(
  documentId: string,
  ownerId: string,
  permission: SharePermission,
  expiresAt?: Date
) {
  const doc = await prisma.document.findFirst({ where: { id: documentId, ownerId, isDeleted: false } })
  if (!doc) throw new AppError(404, 'Document not found')

  const share = await prisma.documentShare.create({
    data: { documentId, permission, expiresAt },
    select: { token: true, permission: true },
  })

  const url = `${process.env.FRONTEND_URL}/share/${share.token}`
  return { token: share.token, permission: share.permission, url }
}

export async function resolveShare(token: string) {
  const share = await prisma.documentShare.findUnique({
    where: { token },
    include: {
      document: {
        select: { id: true, title: true, content: true, isDeleted: true },
      },
    },
  })

  if (!share) throw new AppError(404, 'Share link not found')
  if (share.document.isDeleted) throw new AppError(404, 'Document has been deleted')
  if (share.expiresAt && share.expiresAt < new Date()) throw new AppError(410, 'Share link has expired')

  return { document: share.document, permission: share.permission }
}
```

- [ ] **Step 2: Replace backend/src/routes/sharing.ts**

```typescript
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { createShare, resolveShare } from '../services/share.service'
import { SharePermission } from '@prisma/client'

const router = Router()

router.post('/documents/:id/share', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { permission, expiresAt } = z.object({
      permission: z.enum(['READ_ONLY', 'EDITABLE']).default('READ_ONLY'),
      expiresAt: z.string().datetime().optional(),
    }).parse(req.body)

    const result = await createShare(
      req.params.id,
      req.user!.id,
      permission as SharePermission,
      expiresAt ? new Date(expiresAt) : undefined
    )
    res.status(201).json(result)
  } catch (err) { next(err) }
})

router.get('/share/:token', async (req, res, next) => {
  try {
    const result = await resolveShare(req.params.token)
    res.json(result)
  } catch (err) { next(err) }
})

export default router
```

- [ ] **Step 3: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add backend/src/services/share.service.ts backend/src/routes/sharing.ts
git commit -m "feat: add document sharing with token generation and resolution"
```

---

## Task 8: WebSocket server (y-websocket)

**Files:**
- Modify: `backend/src/websocket/server.ts`

- [ ] **Step 1: Replace backend/src/websocket/server.ts**

```typescript
import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { URL } from 'url'
import jwt from 'jsonwebtoken'
import * as Y from 'yjs'
import { setupWSConnection } from 'y-websocket/bin/utils'
import { prisma } from '../lib/prisma'

async function authenticateConnection(req: IncomingMessage): Promise<boolean> {
  try {
    const url = new URL(req.url!, `http://localhost`)
    const token = url.searchParams.get('token')
    const documentId = url.searchParams.get('documentId')

    if (!documentId) return false
    if (!token) return false

    // Try JWT first (authenticated user)
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
      const doc = await prisma.document.findFirst({
        where: { id: documentId, ownerId: payload.id, isDeleted: false },
      })
      return !!doc
    } catch {
      // Try share token (public share)
      const share = await prisma.documentShare.findUnique({
        where: { token },
        include: { document: { select: { id: true, isDeleted: true } } },
      })
      if (!share || share.document.isDeleted) return false
      if (share.document.id !== documentId) return false
      if (share.expiresAt && share.expiresAt < new Date()) return false
      return share.permission === 'EDITABLE'
    }
  } catch {
    return false
  }
}

export function setupWebSocketServer(port: number) {
  const wss = new WebSocketServer({ port })

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const authorized = await authenticateConnection(req)
    if (!authorized) {
      ws.close(4001, 'Unauthorized')
      return
    }
    setupWSConnection(ws, req)
  })

  console.log(`WebSocket server running on port ${port}`)
  return wss
}
```

- [ ] **Step 2: Restart backend and verify WebSocket starts**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/backend
npm run dev
```

Expected output includes both:
```
HTTP server running on port 3001
WebSocket server running on port 3002
```

- [ ] **Step 3: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add backend/src/websocket/server.ts
git commit -m "feat: add y-websocket server with JWT and share token auth"
```

---

## Task 9: Frontend lib layer (api, auth)

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/auth.ts`
- Create: `frontend/src/lib/utils.ts`

- [ ] **Step 1: Create frontend/src/lib/utils.ts**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Create frontend/src/lib/auth.ts**

```typescript
const TOKEN_KEY = 'coll-notes-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function decodeUser(token: string): { id: string; email: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { id: payload.id, email: payload.email }
  } catch {
    return null
  }
}

export function getCurrentUser(): { id: string; email: string } | null {
  const token = getToken()
  if (!token) return null
  return decodeUser(token)
}
```

- [ ] **Step 3: Create frontend/src/lib/api.ts**

```typescript
import axios from 'axios'
import { getToken, clearToken } from './auth'

export const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
```

- [ ] **Step 4: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add frontend/src/lib
git commit -m "feat: add frontend lib layer — api client and auth helpers"
```

---

## Task 10: Frontend hooks (useAuth, useDocuments, useVersions)

**Files:**
- Create: `frontend/src/hooks/useAuth.ts`
- Create: `frontend/src/hooks/useDocuments.ts`
- Create: `frontend/src/hooks/useVersions.ts`

- [ ] **Step 1: Create frontend/src/hooks/useAuth.ts**

```typescript
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { setToken, clearToken, getCurrentUser } from '@/lib/auth'

interface AuthResponse {
  token: string
  user: { id: string; email: string; name: string; createdAt: string }
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post<AuthResponse>('/auth/login', data)
      setToken(res.data.token)
      return res.data
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const res = await api.post<AuthResponse>('/auth/register', data)
      setToken(res.data.token)
      return res.data
    },
  })
}

export function useLogout() {
  return () => {
    clearToken()
    window.location.href = '/login'
  }
}

export function useCurrentUser() {
  return getCurrentUser()
}
```

- [ ] **Step 2: Create frontend/src/hooks/useDocuments.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Document {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export function useDocuments() {
  return useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get('/documents')).data,
  })
}

export function useTrashDocuments() {
  return useQuery<(Document & { deletedAt: string })[]>({
    queryKey: ['documents', 'trash'],
    queryFn: async () => (await api.get('/documents/trash')).data,
  })
}

export function useCreateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post<Document>('/documents')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useRenameDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) =>
      (await api.patch<Document>(`/documents/${id}`, { title })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useRestoreDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.post(`/documents/${id}/restore`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['documents', 'trash'] })
    },
  })
}
```

- [ ] **Step 3: Create frontend/src/hooks/useVersions.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Version {
  id: string
  createdAt: string
}

export function useVersions(documentId: string) {
  return useQuery<Version[]>({
    queryKey: ['versions', documentId],
    queryFn: async () => (await api.get(`/documents/${documentId}/versions`)).data,
    enabled: !!documentId,
  })
}

export function useRestoreVersion(documentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (versionId: string) =>
      api.post(`/documents/${documentId}/versions/${versionId}/restore`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['versions', documentId] }),
  })
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add frontend/src/hooks
git commit -m "feat: add TanStack Query hooks for auth, documents, and versions"
```

---

## Task 11: useCollabEditor hook and FocusContext

**Files:**
- Create: `frontend/src/hooks/useCollabEditor.ts`
- Create: `frontend/src/context/FocusContext.tsx`

- [ ] **Step 1: Create frontend/src/hooks/useCollabEditor.ts**

```typescript
import { useEffect, useMemo } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import { getToken } from '@/lib/auth'

const USER_COLORS = ['#F44336', '#9C27B0', '#2196F3', '#4CAF50', '#FF9800', '#00BCD4']

function randomColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

export function useCollabEditor(documentId: string, userName: string) {
  const ydoc = useMemo(() => new Y.Doc(), [documentId])

  const provider = useMemo(() => {
    const token = getToken()
    const wsUrl = `ws://localhost:3002`
    return new WebsocketProvider(wsUrl, documentId, ydoc, {
      params: { token: token || '', documentId },
    })
  }, [documentId, ydoc])

  const persistence = useMemo(
    () => new IndexeddbPersistence(`coll-notes-${documentId}`, ydoc),
    [documentId, ydoc]
  )

  useEffect(() => {
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: randomColor(),
    })

    return () => {
      provider.disconnect()
      persistence.destroy()
      ydoc.destroy()
    }
  }, [provider, persistence, ydoc, userName])

  return { ydoc, provider }
}
```

- [ ] **Step 2: Create frontend/src/context/FocusContext.tsx**

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface FocusContextValue {
  isFocused: boolean
  toggleFocus: () => void
}

const FocusContext = createContext<FocusContextValue>({
  isFocused: false,
  toggleFocus: () => {},
})

export function FocusProvider({ children }: { children: ReactNode }) {
  const [isFocused, setIsFocused] = useState(() => {
    return localStorage.getItem('focus-mode') === 'true'
  })

  const toggleFocus = () => {
    setIsFocused((prev) => {
      const next = !prev
      localStorage.setItem('focus-mode', String(next))
      return next
    })
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        toggleFocus()
      }
      if (e.key === 'Escape' && isFocused) {
        setIsFocused(false)
        localStorage.setItem('focus-mode', 'false')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFocused])

  return (
    <FocusContext.Provider value={{ isFocused, toggleFocus }}>
      {children}
    </FocusContext.Provider>
  )
}

export function useFocus() {
  return useContext(FocusContext)
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add frontend/src/hooks/useCollabEditor.ts frontend/src/context
git commit -m "feat: add Yjs collab editor hook, IndexedDB offline persistence, focus mode context"
```

---

## Task 12: Auth pages and App router

**Files:**
- Create: `frontend/src/components/auth/LoginForm.tsx`
- Create: `frontend/src/components/auth/RegisterForm.tsx`
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/pages/RegisterPage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create frontend/src/components/auth/LoginForm.tsx**

```tsx
import { useState } from 'react'
import { useLogin } from '@/hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login.mutateAsync({ email, password })
    navigate('/')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-bold">Sign in</h1>
      {login.error && (
        <p className="text-destructive text-sm">Invalid email or password</p>
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={login.isPending}
        className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-sm text-muted-foreground text-center">
        No account? <Link to="/register" className="underline">Register</Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 2: Create frontend/src/components/auth/RegisterForm.tsx**

```tsx
import { useState } from 'react'
import { useRegister } from '@/hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const register = useRegister()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await register.mutateAsync({ name, email, password })
    navigate('/')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-bold">Create account</h1>
      {register.error && (
        <p className="text-destructive text-sm">Registration failed. Email may already be taken.</p>
      )}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        type="password"
        placeholder="Password (min 8 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
        className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={register.isPending}
        className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {register.isPending ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-sm text-muted-foreground text-center">
        Have an account? <Link to="/login" className="underline">Sign in</Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 3: Create frontend/src/pages/LoginPage.tsx**

```tsx
import { LoginForm } from '@/components/auth/LoginForm'

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoginForm />
    </div>
  )
}
```

- [ ] **Step 4: Create frontend/src/pages/RegisterPage.tsx**

```tsx
import { RegisterForm } from '@/components/auth/RegisterForm'

export function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <RegisterForm />
    </div>
  )
}
```

- [ ] **Step 5: Create frontend/src/App.tsx**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FocusProvider } from '@/context/FocusContext'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { WorkspacePage } from '@/pages/WorkspacePage'
import { SharedDocumentPage } from '@/pages/SharedDocumentPage'
import { getToken } from '@/lib/auth'

const queryClient = new QueryClient()

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FocusProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/share/:token" element={<SharedDocumentPage />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <WorkspacePage />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </FocusProvider>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 6: Create placeholder pages to unblock compilation**

Create `frontend/src/pages/WorkspacePage.tsx`:
```tsx
export function WorkspacePage() {
  return <div>Workspace (coming soon)</div>
}
```

Create `frontend/src/pages/SharedDocumentPage.tsx`:
```tsx
export function SharedDocumentPage() {
  return <div>Shared document (coming soon)</div>
}
```

- [ ] **Step 7: Start frontend dev server and verify login page renders**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/frontend
npm run dev
```

Open `http://localhost:5173/login` — login form should render with email + password fields.

- [ ] **Step 8: Run frontend tests — verify LoginForm tests pass**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/frontend
npm test -- --reporter=verbose src/test/LoginForm.test.tsx
```

Expected: Both LoginForm tests pass. Green phase for auth UI.

- [ ] **Step 9: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add frontend/src
git commit -m "feat: add auth pages, App router with private route guard (tests green)"
```

---

## Task 12b: Frontend test infrastructure and failing tests (TDD)

**Files:**
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/test/LoginForm.test.tsx`
- Create: `frontend/src/test/useDocuments.test.tsx`
- Modify: `frontend/package.json` (add test deps and script)
- Modify: `frontend/vite.config.ts` (add test config)

- [ ] **Step 1: Install frontend test dependencies**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/frontend
npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom msw
```

- [ ] **Step 2: Add test config to frontend/vite.config.ts**

Add `test` block inside `defineConfig`:
```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
},
```

Full updated file:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 3: Add test script to frontend/package.json scripts section**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create frontend/src/test/setup.ts**

```typescript
import '@testing-library/jest-dom'
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

- [ ] **Step 5: Create frontend/src/test/mocks/handlers.ts**

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/auth/login', () =>
    HttpResponse.json({ token: 'fake-jwt', user: { id: '1', email: 'test@example.com', name: 'Test' } })
  ),
  http.get('/api/documents', () =>
    HttpResponse.json([
      { id: 'doc-1', title: 'First Note', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ])
  ),
  http.post('/api/documents', () =>
    HttpResponse.json({ id: 'doc-new', title: 'Untitled', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { status: 201 })
  ),
  http.patch('/api/documents/:id', ({ params }) =>
    HttpResponse.json({ id: params.id, title: 'Renamed', updatedAt: new Date().toISOString() })
  ),
  http.delete('/api/documents/:id', () => HttpResponse.json({ ok: true })),
]
```

- [ ] **Step 6: Create frontend/src/test/mocks/server.ts**

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

- [ ] **Step 7: Create frontend/src/test/LoginForm.test.tsx with failing tests**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    render(<LoginForm />, { wrapper })
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('shows loading state on submit', async () => {
    render(<LoginForm />, { wrapper })
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/signing in/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 8: Create frontend/src/test/useDocuments.test.tsx with failing tests**

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDocuments, useCreateDocument } from '@/hooks/useDocuments'

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useDocuments', () => {
  it('fetches and returns documents', async () => {
    const { result } = renderHook(() => useDocuments(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].title).toBe('First Note')
  })
})

describe('useCreateDocument', () => {
  it('returns new document on mutate', async () => {
    const { result } = renderHook(() => useCreateDocument(), { wrapper })
    result.current.mutate()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe('doc-new')
  })
})
```

- [ ] **Step 9: Run tests — verify they FAIL (components not yet built)**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/frontend
npm test
```

Expected: Fail with `Cannot find module '@/components/auth/LoginForm'` and `Cannot find module '@/hooks/useDocuments'`. Red phase.

- [ ] **Step 10: Commit failing frontend tests**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add frontend/src/test frontend/vite.config.ts
git commit -m "test: add failing frontend tests for LoginForm and useDocuments hooks (TDD red phase)"
```

---

## Task 13: Sidebar components

**Files:**
- Create: `frontend/src/components/sidebar/DocumentItem.tsx`
- Create: `frontend/src/components/sidebar/DocumentList.tsx`
- Create: `frontend/src/components/sidebar/TrashList.tsx`
- Create: `frontend/src/components/sidebar/Sidebar.tsx`

- [ ] **Step 1: Create frontend/src/components/sidebar/DocumentItem.tsx**

```tsx
import { useState } from 'react'
import { useRenameDocument, useDeleteDocument } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'

interface Props {
  id: string
  title: string
  isActive: boolean
  onSelect: (id: string) => void
}

export function DocumentItem({ id, title, isActive, onSelect }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const rename = useRenameDocument()
  const del = useDeleteDocument()

  const commitRename = () => {
    if (draft.trim() && draft !== title) rename.mutate({ id, title: draft.trim() })
    setEditing(false)
  }

  return (
    <div
      className={cn(
        'group flex items-center justify-between px-3 py-1.5 rounded cursor-pointer text-sm',
        isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
      )}
      onClick={() => onSelect(id)}
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => e.key === 'Enter' && commitRename()}
          className="flex-1 bg-transparent outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate">{title || 'Untitled'}</span>
      )}
      <div className="hidden group-hover:flex gap-1 ml-2">
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); setDraft(title) }}
          className="text-muted-foreground hover:text-foreground text-xs px-1"
        >
          ✏️
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); del.mutate(id) }}
          className="text-muted-foreground hover:text-destructive text-xs px-1"
        >
          🗑
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create frontend/src/components/sidebar/DocumentList.tsx**

```tsx
import { useDocuments } from '@/hooks/useDocuments'
import { DocumentItem } from './DocumentItem'

interface Props {
  activeId: string | null
  onSelect: (id: string) => void
}

export function DocumentList({ activeId, onSelect }: Props) {
  const { data: docs, isLoading } = useDocuments()

  if (isLoading) return <p className="px-3 py-2 text-sm text-muted-foreground">Loading…</p>
  if (!docs?.length) return <p className="px-3 py-2 text-sm text-muted-foreground">No documents yet</p>

  return (
    <div className="flex flex-col gap-0.5">
      {docs.map((doc) => (
        <DocumentItem
          key={doc.id}
          id={doc.id}
          title={doc.title}
          isActive={doc.id === activeId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create frontend/src/components/sidebar/TrashList.tsx**

```tsx
import { useTrashDocuments, useRestoreDocument } from '@/hooks/useDocuments'

export function TrashList() {
  const { data: docs } = useTrashDocuments()
  const restore = useRestoreDocument()

  if (!docs?.length) return <p className="px-3 py-2 text-sm text-muted-foreground">Trash is empty</p>

  return (
    <div className="flex flex-col gap-0.5">
      {docs.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between px-3 py-1.5 text-sm text-muted-foreground">
          <span className="truncate flex-1">{doc.title || 'Untitled'}</span>
          <button
            onClick={() => restore.mutate(doc.id)}
            className="text-xs ml-2 hover:text-foreground"
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create frontend/src/components/sidebar/Sidebar.tsx**

```tsx
import { useState } from 'react'
import { useCreateDocument } from '@/hooks/useDocuments'
import { useLogout, useCurrentUser } from '@/hooks/useAuth'
import { DocumentList } from './DocumentList'
import { TrashList } from './TrashList'
import { useFocus } from '@/context/FocusContext'
import { cn } from '@/lib/utils'

interface Props {
  activeId: string | null
  onSelect: (id: string) => void
}

export function Sidebar({ activeId, onSelect }: Props) {
  const [showTrash, setShowTrash] = useState(false)
  const create = useCreateDocument()
  const logout = useLogout()
  const user = useCurrentUser()
  const { isFocused } = useFocus()

  const handleCreate = async () => {
    const doc = await create.mutateAsync()
    onSelect(doc.id)
  }

  return (
    <aside
      className={cn(
        'w-60 border-r bg-muted/30 flex flex-col h-full transition-all duration-200',
        isFocused && 'w-0 overflow-hidden border-none'
      )}
    >
      <div className="p-3 border-b">
        <p className="text-sm font-semibold truncate">{user?.email}</p>
        <button
          onClick={handleCreate}
          disabled={create.isPending}
          className="mt-2 w-full text-left text-sm px-2 py-1 rounded hover:bg-accent"
        >
          + New document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-xs text-muted-foreground uppercase px-1 mb-1">Documents</p>
        <DocumentList activeId={activeId} onSelect={onSelect} />

        <button
          onClick={() => setShowTrash((v) => !v)}
          className="text-xs text-muted-foreground uppercase px-1 mt-4 mb-1 w-full text-left hover:text-foreground"
        >
          {showTrash ? '▾' : '▸'} Trash
        </button>
        {showTrash && <TrashList />}
      </div>

      <div className="p-3 border-t">
        <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add frontend/src/components/sidebar
git commit -m "feat: add sidebar with document list, rename, delete, trash, restore"
```

---

## Task 14: Editor components (Tiptap + Yjs + slash commands + presence)

**Files:**
- Create: `frontend/src/components/editor/SlashCommands.tsx`
- Create: `frontend/src/components/editor/EditorToolbar.tsx`
- Create: `frontend/src/components/editor/PresenceAvatars.tsx`
- Create: `frontend/src/components/editor/Editor.tsx`

- [ ] **Step 1: Create frontend/src/components/editor/SlashCommands.tsx**

```tsx
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

const commands = [
  { title: 'Heading 1', command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run() },
  { title: 'Heading 2', command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run() },
  { title: 'Heading 3', command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run() },
  { title: 'Bullet List', command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
  { title: 'Code Block', command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
  {
    title: 'Meeting Note',
    command: ({ editor, range }: any) =>
      editor.chain().focus().deleteRange(range)
        .setHeading({ level: 2 }).insertContent('Meeting\n')
        .setHeading({ level: 3 }).insertContent('Attendees\n')
        .setParagraph().insertContent('\n')
        .setHeading({ level: 3 }).insertContent('Agenda\n')
        .setParagraph().insertContent('\n')
        .setHeading({ level: 3 }).insertContent('Action Items\n')
        .run(),
  },
  {
    title: 'Decision Record',
    command: ({ editor, range }: any) =>
      editor.chain().focus().deleteRange(range)
        .setHeading({ level: 2 }).insertContent('Decision\n')
        .setHeading({ level: 3 }).insertContent('Context\n')
        .setParagraph().insertContent('\n')
        .setHeading({ level: 3 }).insertContent('Decision\n')
        .setParagraph().insertContent('\n')
        .setHeading({ level: 3 }).insertContent('Consequences\n')
        .run(),
  },
]

const CommandList = forwardRef((props: any, ref) => {
  const [selected, setSelected] = useState(0)
  const filtered = commands.filter((c) => c.title.toLowerCase().includes(props.query.toLowerCase()))

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') { setSelected((s) => (s - 1 + filtered.length) % filtered.length); return true }
      if (event.key === 'ArrowDown') { setSelected((s) => (s + 1) % filtered.length); return true }
      if (event.key === 'Enter') { filtered[selected]?.command(props); return true }
      return false
    },
  }))

  if (!filtered.length) return null

  return (
    <div className="bg-background border rounded shadow-lg p-1 min-w-40">
      {filtered.map((item, i) => (
        <button
          key={item.title}
          onClick={() => item.command(props)}
          className={`block w-full text-left px-3 py-1.5 text-sm rounded ${i === selected ? 'bg-accent' : 'hover:bg-muted'}`}
        >
          {item.title}
        </button>
      ))}
    </div>
  )
})

export const SlashCommands = Extension.create({
  name: 'slashCommands',
  addProseMirrorPlugins() {
    let component: ReactRenderer | null = null
    let popup: any = null
    return [
      new Plugin({
        key: new PluginKey('slashCommands'),
        props: {
          handleKeyDown(view, event) {
            if (event.key === 'Escape' && popup?.[0]?.isVisible) { popup?.[0]?.hide(); return true }
            return component?.ref?.onKeyDown?.({ event }) ?? false
          },
        },
        view(editorView) {
          return {
            update(view, prevState) {
              const { selection, doc } = view.state
              const { from } = selection
              const text = doc.textBetween(Math.max(0, from - 50), from, '\n', '\0')
              const slashMatch = text.match(/\/(\w*)$/)

              if (!slashMatch) { popup?.[0]?.hide(); return }

              const range = { from: from - slashMatch[0].length, to: from }

              if (!component) {
                component = new ReactRenderer(CommandList, {
                  props: { query: slashMatch[1], editor: view, range },
                  editor: (editorView as any).editor,
                })
                popup = tippy('body', {
                  getReferenceClientRect: () => view.coordsAtPos(from) as DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              } else {
                component.updateProps({ query: slashMatch[1], editor: view, range })
                popup?.[0]?.show()
              }
            },
            destroy() { component?.destroy(); popup?.[0]?.destroy() },
          }
        },
      }),
    ]
  },
})
```

- [ ] **Step 2: Install tippy.js**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/frontend
npm install tippy.js
```

- [ ] **Step 3: Create frontend/src/components/editor/EditorToolbar.tsx**

```tsx
import { Editor as TiptapEditor } from '@tiptap/react'
import { useFocus } from '@/context/FocusContext'

interface Props {
  editor: TiptapEditor | null
}

export function EditorToolbar({ editor }: Props) {
  const { isFocused, toggleFocus } = useFocus()
  if (!editor) return null

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b bg-background text-sm flex-wrap">
      <button onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded font-bold ${editor.isActive('bold') ? 'bg-accent' : 'hover:bg-muted'}`}>B</button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded italic ${editor.isActive('italic') ? 'bg-accent' : 'hover:bg-muted'}`}>I</button>
      <button onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
        className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-accent' : 'hover:bg-muted'}`}>H1</button>
      <button onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-accent' : 'hover:bg-muted'}`}>H2</button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-accent' : 'hover:bg-muted'}`}>• List</button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`px-2 py-1 rounded font-mono ${editor.isActive('codeBlock') ? 'bg-accent' : 'hover:bg-muted'}`}>{`</>`}</button>
      <div className="flex-1" />
      <button onClick={toggleFocus}
        className="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
        title="Focus mode (⌘⇧F)">
        {isFocused ? '⊠ Exit focus' : '⊡ Focus'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Create frontend/src/components/editor/PresenceAvatars.tsx**

```tsx
import { WebsocketProvider } from 'y-websocket'
import { useEffect, useState } from 'react'

interface PresenceUser {
  name: string
  color: string
  clientId: number
}

interface Props {
  provider: WebsocketProvider
  currentUserId: string
}

export function PresenceAvatars({ provider }: Props) {
  const [users, setUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    const update = () => {
      const states = Array.from(provider.awareness.getStates().entries())
      const others = states
        .filter(([clientId]) => clientId !== provider.awareness.clientID)
        .map(([clientId, state]) => ({
          clientId,
          name: state.user?.name || 'Anonymous',
          color: state.user?.color || '#888',
        }))
      setUsers(others)
    }

    provider.awareness.on('change', update)
    return () => provider.awareness.off('change', update)
  }, [provider])

  if (!users.length) return null

  return (
    <div className="flex items-center gap-1 px-2">
      {users.map((u) => (
        <div
          key={u.clientId}
          title={u.name}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
          style={{ backgroundColor: u.color }}
        >
          {u.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create frontend/src/components/editor/Editor.tsx**

```tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback } from 'react'
import { useCollabEditor } from '@/hooks/useCollabEditor'
import { useCurrentUser } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { createVersion } from '@/lib/versionHelper'
import { EditorToolbar } from './EditorToolbar'
import { PresenceAvatars } from './PresenceAvatars'
import { SlashCommands } from './SlashCommands'
import { useFocus } from '@/context/FocusContext'
import { cn } from '@/lib/utils'

interface Props {
  documentId: string
  readOnly?: boolean
}

let saveTimer: ReturnType<typeof setTimeout>
let versionTimer: ReturnType<typeof setInterval>

export function Editor({ documentId, readOnly = false }: Props) {
  const user = useCurrentUser()
  const { ydoc, provider } = useCollabEditor(documentId, user?.email || 'Anonymous')
  const { isFocused } = useFocus()

  const debouncedSave = useCallback(() => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      const state = Buffer.from(require('yjs').encodeStateAsUpdate(ydoc))
      await api.patch(`/documents/${documentId}`, { content: Array.from(state) }).catch(() => {})
    }, 1500)
  }, [documentId, ydoc])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider,
        user: { name: user?.email || 'Anonymous', color: '#2196F3' },
      }),
      Placeholder.configure({ placeholder: "Start writing, or type '/' for commands…" }),
      SlashCommands,
    ],
    editable: !readOnly,
    onUpdate: debouncedSave,
  })

  useEffect(() => {
    versionTimer = setInterval(async () => {
      const state = require('yjs').encodeStateAsUpdate(ydoc)
      await api.post(`/documents/${documentId}/versions`, {
        content: Array.from(state),
      }).catch(() => {})
    }, 5 * 60 * 1000)

    return () => { clearInterval(versionTimer); clearTimeout(saveTimer) }
  }, [documentId, ydoc])

  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <div className="flex items-center border-b">
          <EditorToolbar editor={editor} />
          <PresenceAvatars provider={provider} currentUserId={user?.id || ''} />
        </div>
      )}
      <div className={cn('flex-1 overflow-y-auto', isFocused && 'flex justify-center')}>
        <EditorContent
          editor={editor}
          className={cn(
            'prose prose-sm max-w-none p-8 min-h-full focus:outline-none',
            isFocused && 'max-w-[680px] w-full'
          )}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create frontend/src/lib/versionHelper.ts**

```typescript
import { api } from './api'

export async function createVersion(documentId: string, content: Uint8Array) {
  await api.post(`/documents/${documentId}/versions`, {
    content: Array.from(content),
  }).catch(() => {})
}
```

- [ ] **Step 7: Add version save endpoint to backend**

The `POST /api/documents/:id/versions` endpoint saves a manual snapshot. Add to `backend/src/routes/versions.ts`:

```typescript
import { z } from 'zod'
import { createVersion } from '../services/version.service'

// Add this route before export
router.post('/:id/versions', async (req: AuthRequest, res, next) => {
  try {
    const { content } = z.object({ content: z.array(z.number()) }).parse(req.body)
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id, isDeleted: false }
    })
    if (!doc) return next(new AppError(404, 'Document not found'))
    const version = await createVersion(req.params.id, Buffer.from(content))
    res.status(201).json(version)
  } catch (err) { next(err) }
})
```

Also add import at top of `backend/src/routes/versions.ts`:
```typescript
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
```

- [ ] **Step 8: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add frontend/src/components/editor frontend/src/lib/versionHelper.ts backend/src/routes/versions.ts
git commit -m "feat: add Tiptap editor with Yjs collab, slash commands, toolbar, presence avatars"
```

---

## Task 15: Version history and sharing panels

**Files:**
- Create: `frontend/src/components/versions/VersionItem.tsx`
- Create: `frontend/src/components/versions/VersionHistoryPanel.tsx`
- Create: `frontend/src/components/sharing/ShareDialog.tsx`

- [ ] **Step 1: Create frontend/src/components/versions/VersionItem.tsx**

```tsx
import { useRestoreVersion } from '@/hooks/useVersions'

interface Props {
  id: string
  documentId: string
  createdAt: string
  isLatest: boolean
}

export function VersionItem({ id, documentId, createdAt, isLatest }: Props) {
  const restore = useRestoreVersion(documentId)

  return (
    <div className="flex items-center justify-between px-3 py-2 text-sm border-b last:border-0">
      <div>
        <p className="font-medium">{new Date(createdAt).toLocaleString()}</p>
        {isLatest && <p className="text-xs text-muted-foreground">Current version</p>}
      </div>
      {!isLatest && (
        <button
          onClick={() => restore.mutate(id)}
          disabled={restore.isPending}
          className="text-xs px-2 py-1 rounded border hover:bg-accent disabled:opacity-50"
        >
          Restore
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create frontend/src/components/versions/VersionHistoryPanel.tsx**

```tsx
import { useVersions } from '@/hooks/useVersions'
import { VersionItem } from './VersionItem'

interface Props {
  documentId: string
  onClose: () => void
}

export function VersionHistoryPanel({ documentId, onClose }: Props) {
  const { data: versions, isLoading } = useVersions(documentId)

  return (
    <div className="w-72 border-l bg-background flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">Version History</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && <p className="px-4 py-3 text-sm text-muted-foreground">Loading…</p>}
        {versions?.map((v, i) => (
          <VersionItem
            key={v.id}
            id={v.id}
            documentId={documentId}
            createdAt={v.createdAt}
            isLatest={i === 0}
          />
        ))}
        {versions?.length === 0 && (
          <p className="px-4 py-3 text-sm text-muted-foreground">No versions yet. Auto-saved every 5 minutes.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create frontend/src/components/sharing/ShareDialog.tsx**

```tsx
import { useState } from 'react'
import { api } from '@/lib/api'

interface Props {
  documentId: string
  onClose: () => void
}

export function ShareDialog({ documentId, onClose }: Props) {
  const [permission, setPermission] = useState<'READ_ONLY' | 'EDITABLE'>('READ_ONLY')
  const [link, setLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/documents/${documentId}/share`, { permission })
      setLink(res.data.url)
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Share document</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['READ_ONLY', 'EDITABLE'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPermission(p)}
              className={`px-3 py-1.5 rounded text-sm border ${permission === p ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
            >
              {p === 'READ_ONLY' ? 'Read only' : 'Can edit'}
            </button>
          ))}
        </div>

        {!link ? (
          <button
            onClick={generate}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate link'}
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 border rounded px-3 py-2 text-sm bg-muted"
            />
            <button
              onClick={copy}
              className="px-3 py-2 rounded border text-sm hover:bg-accent"
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add frontend/src/components/versions frontend/src/components/sharing
git commit -m "feat: add version history panel and share dialog"
```

---

## Task 16: Workspace and document pages (main app shell)

**Files:**
- Modify: `frontend/src/pages/WorkspacePage.tsx`
- Modify: `frontend/src/pages/SharedDocumentPage.tsx`
- Create: `frontend/src/pages/DocumentPage.tsx`

- [ ] **Step 1: Replace frontend/src/pages/WorkspacePage.tsx**

```tsx
import { useState } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { DocumentPage } from './DocumentPage'

export function WorkspacePage() {
  const [activeDocId, setActiveDocId] = useState<string | null>(null)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeId={activeDocId} onSelect={setActiveDocId} />
      <main className="flex-1 overflow-hidden">
        {activeDocId ? (
          <DocumentPage documentId={activeDocId} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select a document or create a new one
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create frontend/src/pages/DocumentPage.tsx**

```tsx
import { useState } from 'react'
import { Editor } from '@/components/editor/Editor'
import { VersionHistoryPanel } from '@/components/versions/VersionHistoryPanel'
import { ShareDialog } from '@/components/sharing/ShareDialog'
import { useDocuments } from '@/hooks/useDocuments'

interface Props {
  documentId: string
}

export function DocumentPage({ documentId }: Props) {
  const [showVersions, setShowVersions] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const { data: docs } = useDocuments()
  const doc = docs?.find((d) => d.id === documentId)

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <h1 className="font-semibold truncate">{doc?.title || 'Untitled'}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowVersions((v) => !v)}
              className="text-sm px-3 py-1.5 rounded border hover:bg-accent"
            >
              History
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90"
            >
              Share
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <Editor documentId={documentId} />
        </div>
      </div>

      {showVersions && (
        <VersionHistoryPanel documentId={documentId} onClose={() => setShowVersions(false)} />
      )}
      {showShare && (
        <ShareDialog documentId={documentId} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Replace frontend/src/pages/SharedDocumentPage.tsx**

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { Editor } from '@/components/editor/Editor'

interface ShareData {
  document: { id: string; title: string }
  permission: 'READ_ONLY' | 'EDITABLE'
}

export function SharedDocumentPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<ShareData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/share/${token}`)
      .then((res) => setData(res.data))
      .catch(() => setError('This link is invalid or has expired.'))
  }, [token])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        {error}
      </div>
    )
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 py-3 border-b flex items-center gap-3">
        <span className="font-semibold">{data.document.title}</span>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded border">
          {data.permission === 'READ_ONLY' ? 'Read only' : 'Collaborative editing'}
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          documentId={data.document.id}
          readOnly={data.permission === 'READ_ONLY'}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add frontend/src/pages
git commit -m "feat: add workspace shell, document page with history/share, shared document view"
```

---

## Task 17: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add README.md
git commit -m "docs: add comprehensive README with architecture, setup, and AI usage notes"
```

---

## Task 18: End-to-end smoke test and Docker build

- [ ] **Step 1: Run the full stack locally without Docker**

Terminal 1:
```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/backend
npm run dev
```

Terminal 2:
```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes/frontend
npm run dev
```

- [ ] **Step 2: Test golden path**

1. Open `http://localhost:5173/register` — create account
2. Create a new document — verify it appears in sidebar
3. Type content — verify auto-save (check network tab, PATCH request fires ~1.5s after typing stops)
4. Type `/` — verify slash command menu appears
5. Select `/heading` — verify H1 inserted
6. Click "History" — verify version panel opens (may be empty until 5 min timer fires, or POST manually)
7. Click "Share" — generate read-only link, open in incognito — verify document renders read-only
8. Generate editable link — open in incognito — verify real-time sync between windows
9. Press ⌘⇧F — verify sidebar and toolbar hide, content centers
10. Rename a document — verify sidebar updates immediately
11. Delete a document — verify it moves to trash
12. Restore from trash — verify it reappears in active list

- [ ] **Step 3: Build Docker images**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
docker-compose build
```

Expected: Both images build without errors.

- [ ] **Step 4: Run full stack via Docker**

```bash
docker-compose up
```

Expected: postgres healthy → backend starts → frontend serves on port 5173. Repeat smoke test at `http://localhost:5173`.

- [ ] **Step 5: Final commit**

```bash
cd /Users/hasanbilgen/Documents/Development/coll-notes
git add .
git commit -m "chore: verify full stack builds and runs via docker-compose"
```
