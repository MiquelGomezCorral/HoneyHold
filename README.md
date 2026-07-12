# HoneyHold · a local-first household ledger

Minimal personal finance for a two-person household. React + Node.js + MySQL,
deployed locally with Docker Compose. No accounts, no cloud, no ads — a
profile is a data scope, not an identity.

## Quickstart

```bash
cp .env.example .env        # optional — compose has safe defaults
docker compose up --build
```

| Service   | URL                     |
| --------- | ----------------------- |
| Frontend  | http://localhost:5173   |
| API       | http://localhost:4000   |
| MySQL     | 127.0.0.1:3306          |

First boot initializes the schema and seed data from `db/init/` (only when the
`db_data` volume is empty). `04-isa-data.sql` and `05-maikol-data.sql` are real
imported ledger data; delete them before first boot for a clean slate.
To re-initialize from scratch: `docker compose down -v && docker compose up --build`.



## Development

### Reset everything (wipe DB + rebuild)
```bash
docker compose down -v && docker compose up --build
```

### Host-side install (when Docker node_modules are root-owned)
After `docker compose up --build`, the Docker container creates `node_modules` as root.
If you get permission errors running `bun i` / `npm i` on the host:

```bash
# Backend
sudo rm -rf backend/node_modules && cd backend && npm install

# Frontend (same issue)
sudo rm -rf frontend/node_modules && cd frontend && npm install
```
## Project structure

```
HoneyHold/
├── docker-compose.yml          # db + backend + frontend + db-backup
├── .env.example
├── backups/                    # dumps land here (bind mount)
├── db/
│   ├── init/                   # runs on first boot, in order
│   │   ├── 01-schema.sql
│   │   ├── 02-core-data.sql    # profiles, accounts, tags, starter goals
│   │   ├── 04-isa-data.sql     # real ledger: Honey 2 (Jan-Jul 2026)
│   │   └── 05-maikol-data.sql  # real ledger: Honey 1 (Dec 2025-Jul 2026)
│   └── backup/                 # cron + mysqldump sidecar image
├── backend/
│   ├── scripts/
│   │   └── simulate-bank-feed.js
│   └── src/
│       ├── server.ts           # boot + materializer schedule
│       ├── app.ts              # express wiring
│       ├── config/  db/  middleware/  types/  utils/
│       ├── routes/             # thin HTTP layer, one file per domain
│       ├── services/           # all SQL + business rules live here
│       └── jobs/materialize.ts # recurring rules → real transactions
└── frontend/
    └── src/
        ├── api/client.ts       # the only place fetch() is called
        ├── context/ProfileContext.tsx  # active scope + refetch signal
        ├── hooks/  lib/  components/  types/
        ├── features/
        │   ├── dashboard/  transactions/  inbox/  mobile/
        └── styles/global.css   # @tailwind directives + resets
```

**Layering:** routes stay thin (parse, delegate, respond); services own SQL
and rules; the pool is the only DB touchpoint. On the frontend, views compose
shared components and fetch through one client — no view knows about hosts.

## Profiles are query scopes

`profiles` → `accounts` → `transactions`. Every scoped endpoint lives under
`/api/profiles/:profileId/…`, and `transactions.profile_id` is deliberately
denormalized so switching profiles is exactly one `WHERE profile_id = ?` swap.
The UI reads the active id from `ProfileContext`; the views never change.

## Fixed entries (recurring engine)

Ticking **Is fixed?** in the add-entry modal creates a `recurring_rules` row
instead of a bare transaction. The materializer (`jobs/materialize.js`) runs
on boot, every 12 h, and immediately after a rule is created: it inserts a
real transaction for every due date `≤ today`, then advances `next_due` by the
frequency. Stopping a rule (Transactions → Fixed rules → Stop) deactivates it;
past ledger rows stay.

## Automation & Inbox (decoupled by design)

Nothing automated ever writes to the ledger. External feeds push to:

```
POST /api/ingest
x-ingest-token: <INGEST_TOKEN>

[{ "source": "openbanking:bbva",      // required
   "external_id": "abc-123",          // dedupe key per source
   "amount": -23.40,                  // negative → expense
   "date": "2026-07-05",              // required, YYYY-MM-DD
   "concept": "CARD PURCHASE …",
   "counterparty": "Consum",
   "profile_slug": "maikol",         // optional routing hints
   "account_name": "BBVA",
   "raw": { … } }]                    // stored verbatim as JSON
```

Items land in `inbox_entries` (`(source, external_id)` is unique, so
re-deliveries are skipped). The **Inbox** view lets a human edit every field
in place, then **Approve** (promotes to the ledger atomically, source
`automated`) or **Reject**. Try it:

```bash
docker compose exec backend node scripts/simulate-bank-feed.js
```

A future Open Banking worker only needs the token and that JSON contract — it
can live in its own container and never touch the schema.

## Backups

The `db-backup` container runs real cron inside the same `mysql:8.4` image as
the database, so `mysqldump` always matches the server. Defaults: daily at
03:00 (`BACKUP_CRON`), gzipped into `./backups/`, pruned after 14 days
(`BACKUP_RETENTION_DAYS`). One backup is also taken on container start.

Restore:

```bash
gunzip < backups/finance_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T db mysql -uroot -p"$MYSQL_ROOT_PASSWORD"
```

## Environment

All variables live in `.env.example`: MySQL credentials, `INGEST_TOKEN`
(shared secret for `/api/ingest`), and the backup schedule/retention. Compose
falls back to the same defaults if no `.env` exists.

## Mobile

Below 640 px the app swaps to a single screen: total balance, this month's
in/out, and two buttons that open the same add-entry modal (as a bottom
sheet). Analysis and inbox triage are desktop concerns on purpose.

## A note on exposure

There is intentionally no authentication: this is built to run on your own
machine or home network. Don't publish ports 4000/5173 to the internet
without putting real auth in front.
