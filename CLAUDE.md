# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Database schema

The database schema is defined in [prisma/schema.prisma](prisma/schema.prisma). Reference it anytime you need to understand the structure of data stored in the database.

## Commands

```bash
npm run setup        # First-time setup: install deps + Prisma generate + migrate
npm run dev          # Dev server with Turbopack (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Run all Vitest tests
npx vitest run src/components/chat/__tests__/MessageList.test.tsx  # Run single test file
npm run db:reset     # Drop and recreate the SQLite database
```

Set `ANTHROPIC_API_KEY` in `.env` to use live Claude. Without it, the app falls back to a mock model returning static code samples.

## Architecture

This is a full-stack AI-powered React component IDE: users describe a UI in chat, Claude generates code via agentic tool calls, and the result appears in a live preview.

### Request flow

1. User sends a chat message → `POST /api/chat` (streamed)
2. `src/app/api/chat/route.ts` calls Claude (`claude-haiku-4-5`) with two tools:
   - `str_replace_editor` — create/view/edit files in the virtual FS
   - `file_manager` — rename/delete files
3. Tool calls are executed server-side and update the virtual file system
4. The client receives streamed text + tool results via Vercel AI SDK
5. `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) reflects changes in the editor and preview
6. Projects are saved to SQLite (Prisma) as serialized JSON blobs (`messages` + `data` fields)

### Virtual file system

`src/lib/file-system.ts` — an in-memory `VirtualFileSystem` class with no disk I/O. Files are serialized to JSON and stored in the `Project.data` column. The context in `src/lib/contexts/file-system-context.tsx` exposes this globally.

### Live preview

`src/components/preview/PreviewFrame.tsx` — runs inside an `<iframe>` using a blob URL. Babel Standalone transforms JSX in the browser; an import map redirects bare specifiers (e.g., `react`) to `esm.sh` CDN. Each file change triggers a full re-render.

### Auth

JWT tokens (7-day, HTTP-only cookie) via `src/lib/auth.ts`. Passwords hashed with bcrypt. Server actions in `src/actions/` handle sign-up/in/out. `src/middleware.ts` protects `/api/chat` and project routes. Anonymous users can work without an account; `src/lib/anon-work-tracker.ts` preserves their work through login.

### State management

Two React contexts hold all runtime state:
- `FileSystemContext` — virtual FS, active file, editor content
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — message history, streaming state

### Database

SQLite via Prisma. Schema: `User` (id, email, hashed password) → `Project` (id, name, `messages` TEXT JSON, `data` TEXT JSON). Migrations live in `prisma/migrations/`.

### AI provider abstraction

`src/lib/provider.ts` exports either the real Anthropic model or a `MockLanguageModel`. The system prompt for Claude is in `src/lib/prompts/generation.tsx`.

## Key file locations

| Concern | Path |
|---|---|
| Claude API route | `src/app/api/chat/route.ts` |
| Agentic tools | `src/lib/tools/str-replace.ts`, `src/lib/tools/file-manager.ts` |
| System prompt | `src/lib/prompts/generation.tsx` |
| Virtual FS | `src/lib/file-system.ts` |
| Preview iframe | `src/components/preview/PreviewFrame.tsx` |
| Auth logic | `src/lib/auth.ts`, `src/actions/index.ts` |
| DB schema | `prisma/schema.prisma` |

## Tech stack notes

- **Next.js 15** App Router; dynamic route `[projectId]` maps to `src/app/[projectId]/page.tsx`
- **Tailwind CSS v4** (PostCSS plugin, not the v3 CLI)
- **Shadcn/ui** components in `src/components/ui/` — add new ones with `npx shadcn@latest add <component>`
- **Monaco Editor** wraps `src/components/editor/CodeEditor.tsx`
- **Vercel AI SDK 4.x** handles streaming and tool-call orchestration on both client and server

## Code style

Use comments sparingly. Only comment complex code.
