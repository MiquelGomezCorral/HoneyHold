# Known Errors

## Errors

None yet. No recurring failures are recorded for this project.

## Known Gaps

- **Editing a fixed/recurring row's rule fields has no effect on the recurring rule.**
  Symptom: opening a fixed (recurring) transaction in the edit modal shows the fixed toggle on, but `frequency` always defaults to `"monthly"` and `start_date` to today. Changing these and saving silently ignores them — the recurring rule is never updated.

  Why: two layers compound.
  1. Frontend `TransactionModal.formFromEntry()` does not load recurring-rule fields (`frequency`, `start_date`) from the linked rule — it only reads the transaction row, which lacks any rule metadata. The modal defaults `frequency: 'monthly'`, so the user always sees a wrong value.
  2. Backend `updateFromModal()` in `transactions.service.ts` only creates a *new* rule when the row transitions from `is_fixed=0 → 1`. If the row already has `is_fixed=1` and `recurring_rule_id`, the recurrence payload is read but discarded — the existing rule is never updated; only `recurring_rule_id` is preserved in the transaction row.

  Fixing this requires: adding rule metadata (frequency, start_date) to the transaction list response, preloading them in the edit form, and adding an `updateRule` service that modifies the linked `recurring_rules` row when the rule's fields change.

When one is found, record: **symptom**, **cause**, **fix**, and any **trap** (e.g. an order-dependent step, a container that must be rebuilt, an env var that must be set first).

## Traps (general, observed from the repo layout)

- **Schema only initializes on an empty `db_data` volume.** Editing `db/init/*.sql` after the first boot does nothing until you `docker compose down -v && docker compose up --build` — that `-v` wipes the volume, destroying data.
- **`03-demo-data.sql` seeds demo content on first boot.** Delete it before first boot for a clean ledger; it will not re-run afterwards (same reason as above).
- **Host port 3306 is exposed to localhost only** (`127.0.0.1:3306` in compose). Connecting from another machine fails by design.
- **Frontend service runs the Vite dev server, not a production build.** `npm run build` exists in `frontend/package.json` but compose does not invoke it; do not expect a built `dist/` in the container.
- **MySQL credentials and `INGEST_TOKEN` have dev-safe defaults baked into `docker-compose.yml`.** They're fine for local use but must be overridden in a real `.env` before any non-local exposure.
- **Backend `package-lock.json` pins dependencies per-install** — there is no workspace/monorepo lockfile; `backend/` and `frontend/` are independent. Don't run `npm install` at the repo root expecting it to cover both.