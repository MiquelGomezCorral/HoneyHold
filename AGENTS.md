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

## Project Notes

- Stack: React 18 (Vite + TypeScript + Tailwind CSS v3) frontend + Node.js/Express API + MySQL 8.4, orchestrated with Docker Compose. ESM on both ends.
- Package manager: npm (per-package `package-lock.json` in `backend/` and `frontend/`; no workspace).
- Main commands:
  - Full stack: `docker compose up --build` (frontend :5173, API :4000, MySQL 127.0.0.1:3306).
  - Re-init DB from scratch: `docker compose down -v && docker compose up --build`.
  - Backend dev (host): `npm run dev` in `backend/` (nodemon).
  - Frontend dev (host): `npm run dev` in `frontend/` (vite --host 0.0.0.0).
  - Simulate bank feed: `docker compose exec backend node scripts/simulate-bank-feed.js`.
  - Restore backup: `gunzip < backups/finance_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T db mysql -uroot -p"$MYSQL_ROOT_PASSWORD"`.
- No test suite or lint config present (None yet.).

## Hard Constraints (do not violate)

- No authentication is intentional — local-only by design. Do not add auth "for safety" without explicit instruction.
- Nothing automated writes to the ledger. Automation feeds `POST /api/ingest` → `inbox_entries`; a human must Approve to promote to `transactions`.
- The pool (`backend/src/db/pool.js`) is the only DB touchpoint. Services own SQL; routes stay thin.
- `transactions.profile_id` is deliberately denormalized — keep it. Profile scoping is one `WHERE profile_id = ?`.
- Config/secret surface: `.env.example` is the contract. New vars must be added there with a safe default and wired into `docker-compose.yml`.