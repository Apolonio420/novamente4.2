# novamente4.2 — Partner Storefront

## Project

Next.js 15.2.6 + TypeScript + Tailwind 4 + shadcn/ui. Public website and partner workspace at novamente.ar.

## Watchdog Protocol

When you receive a prompt starting with `[WATCHDOG`, you are being invoked by an automated watchdog script (not a human). Follow these rules strictly:

### [WATCHDOG - BUG REPORT]
1. Read the error details (message, stack, URL, screenshot)
2. Search the codebase for the relevant code using the file paths from the stack trace
3. Determine if the error is a real bug in the code or a user/environment issue
4. If NOT a bug: respond with `NOT_A_BUG: <one-line reason>`
5. If it requires DB/env changes: respond with `NEEDS_MANUAL: <what's needed>`
6. If it IS a real bug: fix it with **minimal changes** — no refactoring, no features
7. After fixing, run `npx tsc --noEmit` to verify no new errors
8. If tsc passes, run `npx next build` to verify build

### [WATCHDOG - SUPER ACTION]
1. Read the action type, tenant ID, description, and any image URLs
2. For `storefront_edit`: find tenant-specific files and apply the requested change
3. For `catalog_generation`: generate product data programmatically
4. For `custom`: analyze what's requested and execute if reasonable
5. If the action is dangerous or impossible: respond with `CANNOT_DO: <reason>`
6. After changes, run `npx tsc --noEmit` and `npx next build`
7. Do NOT deploy — only make the code changes

### [WATCHDOG - TSC ERRORS]
1. Fix ONLY the TypeScript errors listed in the prompt
2. Minimal changes — do not refactor surrounding code
3. After fixing, run `npx tsc --noEmit` to verify all errors are resolved
4. If all pass: respond with `FIXED: N errores corregidos`
5. If some can't be fixed without more context: respond with `NEEDS_MANUAL: <detail>`

### General Watchdog Rules
- Never create new files unless absolutely necessary for the fix
- Never modify tests unless they are the source of the error
- Never add dependencies
- Never change environment variables or configuration
- Keep your response concise — the output is parsed by the watchdog script
- If you make changes, prefer `Edit` over `Write`
- Always verify with `tsc --noEmit` before declaring success

## Architecture

- `app/` — Next.js App Router pages
- `app/workspace/` — Partner workspace (authenticated)
- `app/merch/[slug]/` — Public storefronts
- `app/api/partners/` — Partner API routes
- `components/workspace/` — Workspace components including assistant widget
- `lib/rag/` — RAG system (chunker, embeddings, vector store, chat)
- `lib/assistant/` — Assistant context provider
- `docs/rag/` — Knowledge base markdown files
- `scripts/watchdog.ps1` — Auto-fix watchdog script

## Auth

Supabase Auth with cookie-based tokens. Pattern: `sb-*-auth-token` cookie → `supabaseAdmin.auth.getUser(token)`.
Partner routes use `getRequestTenant()` from `lib/partners/auth.ts`.

## Key Env Vars

- `GEMINI_API_KEY` — Gemini for RAG embeddings and chat
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — Supabase
- `TELEGRAM_BOT_TOKEN_OPS` / `TELEGRAM_CHAT_ID_OPS` — Watchdog notifications
- `R2_*` — Cloudflare R2 storage
