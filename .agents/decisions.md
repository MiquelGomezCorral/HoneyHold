# Decisions

Record closed decisions here. Do not reopen them unless the user explicitly asks.

## Active Decisions

- **No authentication.** Local-first household ledger; a profile is a data scope, not an identity. Do not add auth without an explicit override. (Rationale: README "A note on exposure".)
- **No ORM, no migration framework.** Schema lives as ordered SQL files in `db/init/` run on first empty-volume boot. Manual SQL in services via the mysql2 pool. (Rationale: stays readable, no migration table to drift on.)
- **`transactions.profile_id` is denormalized.** Derivable through `accounts`, but duplicated so profile switching is exactly one `WHERE profile_id = ?`. Keep it; do not "normalize" it away.
- **Automation never writes the ledger.** External feeds → `POST /api/ingest` → `inbox_entries` (deduped on `(source, external_id)`) → human Approve/Reject → `transactions` (source `automated`). A future Open Banking worker just needs the token + JSON contract; it never touches the schema.
- **Recurring engine = template + materializer.** "Is fixed?" creates a `recurring_rules` row, not a transaction. `jobs/materialize.js` inserts real rows for every `next_due <= today` and advances `next_due` by frequency; runs on boot, every 12h, and right after a rule is created. Stopping a rule deactivates it; past ledger rows stay.
- **Frontend fetch is centralized in `api/client.js`.** No view/component knows hosts/ports; Vite proxies `/api` via `VITE_API_PROXY`.
- **Single stylesheet, design-token based.** `frontend/src/styles/global.css` holds all styling; no CSS-in-JS, no utility framework.
- **Backups use the same `mysql:8.4` image** as the DB so `mysqldump` matches the server. Triggered by cron inside `db-backup`; one dump also runs on container start.

## Revisit When

- Exposing the app beyond localhost / home network → auth becomes mandatory first.
- Multi-tenant or multi-household → revisit the profile-as-scope model.