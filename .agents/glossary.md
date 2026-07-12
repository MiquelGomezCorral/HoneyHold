# Glossary

## Terms

- **HoneyHold** — the project name (Spanish for "piggy bank" / household cash box). Both the repo/workspace directory and the app names in `package.json` (`HoneyHold-backend`, `HoneyHold-frontend`).
- **Profile** — a data scope (not an identity). Root of the scope hierarchy: `profiles` → `accounts` → `transactions`. Every scoped endpoint lives under `/api/profiles/:profileId/…`.
- **Account** — a profile-owned ledger container with a `kind` (checking, savings, trading, investment, cash, other) and `initial_balance`.
- **Transaction** — one ledger row. `type` is `income` or `expense`; `amount` is stored as the positive magnitude, sign implied by `type` (expenses are not stored negative). `txn_date` is `YYYY-MM-DD`. `source` is `manual` or `automated`.
- **Fixed entry / recurring rule** — a template in `recurring_rules` created by the "Is fixed?" toggle in the add-entry modal. Not a ledger row itself; materialized into real transactions by `jobs/materialize.js`.
- **Materializer** — `backend/src/jobs/materialize.js`. Turns due `recurring_rules` into `transactions` rows and advances `next_due`. Schedule: on boot, every 12h, and immediately after a rule is created.
- **Inbox** — staging area for automated entries. External feeds push to `POST /api/ingest`; rows land in `inbox_entries` (unique on `(source, external_id)` so re-deliveries dedupe). A human edits and Approves (→ transaction, `source='automated'`) or Rejects.
- **Ingest** — the single automation entry point: `POST /api/ingest` with header `x-ingest-token: <INGEST_TOKEN>`. The JSON contract is documented in the README (`source`, `external_id`, `amount` (negative = expense), `date`, `concept`, `counterparty`, optional `profile_slug`/`account_name` routing hints, `raw` JSON).
- **`profile_slug`** — short opaque identifier for a profile (e.g. `maikol`); used as an optional routing hint in ingest payloads.
- **`source`** — provenance tag on both `inbox_entries` and `transactions`. `manual` = user-typed; `automated` = approved from inbox; external feed strings like `openbanking:bbva` identify the origin feed.
- **`db-backup`** — Docker Compose sidecar (same `mysql:8.4` base image) running real cron + `mysqldump` into `./backups/`, pruned by `BACKUP_RETENTION_DAYS`.
- **`VITE_API_PROXY`** — env var telling the Vite dev server where the backend is (`http://backend:4000` in compose); the browser only ever sees `/api`.