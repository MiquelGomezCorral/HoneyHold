# Project Agent Rules

This file routes agents to project memory. Read it before changing code in this repo.

## Memory Files

- `.agents/architecture.md` — stack, layout, boundaries, important modules.
- `.agents/conventions.md` — naming, style, imports, testing patterns.
- `.agents/decisions.md` — closed project decisions and rationale.
- `.agents/glossary.md` — domain terms and project-specific vocabulary.
- `.agents/workflow.md` — setup, build, test, release, commit, PR flow.
- `.agents/known-errors.md` — repeated symptoms, causes, fixes, and traps.

## Load Rules

- Load only the memory file relevant to the current task.
- If a memory file conflicts with current code, trust current code and flag the memory entry as stale.
- Do not update memory silently. Propose memory changes unless the user asks to write them.

## Quick Reference

Stack: React 18 + Vite 5 + TypeScript + Tailwind CSS v3 frontend + Node.js/Express 4 + TypeScript backend + MySQL 8.4, orchestrated with Docker Compose. ESM on both ends.

Package manager preference: use `bun` commands for installs/build/dev unless the user explicitly asks for `npm`. `backend/` and `frontend/` are separate packages (no workspace).

### Commands

| What | How |
|------|-----|
| Full stack | `docker compose up --build` |
| Re-init DB (destroys data) | `docker compose down -v && docker compose up --build` |
| Backend dev (host) | `cd backend && bun run dev` (`tsx watch src/server.ts`) |
| Backend typecheck | `cd backend && bun run typecheck` (`tsc --noEmit`) |
| Backend build | `cd backend && bun run build` (`tsc`) |
| Frontend dev (host) | `cd frontend && bun run dev` (`vite --host 0.0.0.0`) |
| Frontend build | `cd frontend && bun run build` (`vite build`) |
| Simulate bank feed | `docker compose exec backend node scripts/simulate-bank-feed.js` |
| Restore backup | `gunzip < backups/finance_YYYYMMDD_HHMMSS.sql.gz \| docker compose exec -T db mysql -uroot -p"$MYSQL_ROOT_PASSWORD"` |

### Architecture

- **Routes** stay thin; **services** own all SQL and business rules.
- `backend/src/db/pool.ts` is the only DB touchpoint.
- Profile scoping via `/api/profiles/:profileId/…`; `transactions.profile_id` is deliberately denormalized.
- Automation → `POST /api/ingest` → `inbox_entries` (never directly to `transactions`). Human must Approve.
- Recurring rules (`recurring_rules`) → materializer (`jobs/materialize.ts`) inserts due transactions on boot, every 12h, and after rule creation.
- No auth (intentional — local-only design).

### Traps

- **DB inits only on empty volume.** `db/init/*.sql` runs once. `04-isa-data.sql` and `05-maikol-data.sql` are real imported ledger data (not optional). `03-demo-data.sql` was removed; if you need clean data, delete `04` and `05` before first boot. Editing after first boot requires `docker compose down -v` (destroys data).
- **Backend is TypeScript.** Dev uses `tsx watch`, not nodemon. `.agents/conventions.md` says ".js" — **stale**. `.agents/workflow.md` says "nodemon" — **stale**.
- **Frontend is TypeScript** (`*.tsx`/`*.ts`). Imports use `.js` extension (Vite convention: `from './Modal.js'` resolves `Modal.tsx`).
- **Frontend runs Vite dev server** in compose, not a production build.
- **No test runner, no lint config, no CI** present anywhere. Verify manually.
- **MySQL port 3306 is localhost-only** (`127.0.0.1:3306` in compose).
- **Install separately** — use `bun install` in `backend/` and `frontend/` independently.

## Hard Constraints (do not violate)

- No authentication — profiles are data scopes, not identities. Do not add auth without explicit instruction.
- Nothing automated writes to the ledger. Ingest → `inbox_entries` → human Approve → `transactions`.
- `backend/src/db/pool.ts` is the only DB touchpoint. Services own SQL; routes stay thin.
- `transactions.profile_id` is deliberately denormalized. Profile scoping is one `WHERE profile_id = ?`.
- `.env.example` is the config contract. New vars must be added there with a safe default and wired into `docker-compose.yml`.
