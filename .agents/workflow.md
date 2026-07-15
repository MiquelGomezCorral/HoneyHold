# Workflow

## Setup

1. Copy the env contract: `cp .env.example .env` (optional — compose has safe defaults). Never commit `.env` (it's gitignored).
2. Build and run everything: `docker compose up --build`.
   - Frontend: http://localhost:5173
   - API: http://localhost:4000 (health at `/api/health`)
   - MySQL: 127.0.0.1:3306
3. First boot auto-runs `db/init/{01-schema,02-core-data,03-demo-data}.sql` only when the `db_data` volume is empty. `03-demo-data.sql` is optional demo content — remove it before first boot for a clean ledger.
4. Re-initialize from scratch: `docker compose down -v && docker compose up --build`.

Host-only dev (no Docker), if needed:
- Backend: `cd backend && bun install && bun run dev`.
- Frontend: `cd frontend && bun install && bun run dev` (vite --host 0.0.0.0; expects `VITE_API_PROXY` to point at a running backend).

## Build

- Frontend production build: `cd frontend && bun run build` (`vite build`) — not used by compose (frontend service runs the Vite dev server in dev).
- Backend Docker image: `backend/Dockerfile`. No separate build step; `node src/server.js` is the start.
- No monorepo workspace: `backend/` and `frontend/` are installed in each directory separately. Prefer `bun`, not `npm`.

## Test

None yet. No `test` script in either `package.json`, no test runner installed. Verify changes manually: `docker compose up --build`, exercise the affected view/endpoint, and check `/api/health` for DB connectivity.

## Commit And PR

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, ...). English only.
- Stage only files you changed; never `git add -A`/`git add .` (`.env` and `backups/` are gitignored but stay careful).
- Never commit secrets: real `INGEST_TOKEN`, real MySQL passwords, or any `.env`. `.env.example` carries dev-safe defaults only.
- No git hooks / pre-commit config present in the repo. Do not add `--no-verify`.
- PRs/push only when explicitly requested.
