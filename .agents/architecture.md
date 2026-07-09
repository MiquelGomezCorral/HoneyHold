# Architecture

## Stack

- **Frontend:** React 18.3 + Vite 5, react-router-dom 6, recharts 2. Single `global.css` with design tokens (no CSS framework). ESM (`"type": "module"`).
- **Backend:** Node.js + Express 4, mysql2 3 (promise pool). ESM. No ORM, no migration tool — schema is SQL files in `db/init/`.
- **DB:** MySQL 8.4 (`mysql:8.4` image). Schema + seeds run once on first boot of an empty `db_data` volume via `/docker-entrypoint-initdb.d`.
- **Deployment:** Docker Compose, four services: `db`, `backend`, `frontend`, `db-backup`. Local-first; no accounts/auth, no cloud.
- **Backup:** `db-backup` sidecar = same `mysql:8.4` image running real cron + `mysqldump`. Daily 03:00 by default, gzipped to `./backups/`, pruned after 14 days. One dump on container start.

## Layout

```
hucha/
├── docker-compose.yml          # db + backend + frontend + db-backup
├── .env.example                # the config contract (MySQL creds, INGEST_TOKEN, backup cron/retention)
├── 01-schema.sql               # canonical schema copy at repo root
├── backups/                    # dumps land here (bind mount); .gitkeep'd
├── db/
│   ├── init/                   # 01-schema.sql, 02-core-data.sql, 03-demo-data.sql (optional)
│   └── backup/                 # Dockerfile + backup.sh + entrypoint.sh for the cron sidecar
├── backend/
│   ├── Dockerfile
│   ├── package.json            # name: hucha-backend
│   ├── scripts/simulate-bank-feed.js
│   └── src/
│       ├── server.js           # boot + scheduleMaterializer(); SIGINT/SIGTERM graceful
│       ├── app.js              # express wiring: cors, json, /api/health, /api router, errorHandler
│       ├── config/env.js        # reads DB_*, PORT, INGEST_TOKEN
│       ├── db/pool.js          # single mysql2 promise pool
│       ├── middleware/errors.js (asyncH, HttpError, errorHandler, notFound)
│       ├── middleware/ingestAuth.js (x-ingest-token check)
│       ├── routes/             # thin: one file per domain, mounted by index.js
│       │   ├── index.js        # /api/profiles, /profiles/:id/transactions, /recurring, /inbox, /ingest
│       │   ├── profiles.routes.js
│       │   ├── transactions.routes.js
│       │   ├── recurring.routes.js
│       │   ├── inbox.routes.js
│       │   └── ingest.routes.js
│       ├── services/           # ALL SQL + business rules live here
│       │   ├── profiles.service.js (incl. accountInProfile scope helper)
│       │   ├── transactions.service.js
│       │   ├── recurring.service.js
│       │   ├── inbox.service.js
│       │   ├── ingest.service.js
│       │   ├── dashboard.service.js
│       │   ├── goals.service.js
│       │   └── tags.service.js (incl. resolveTagId)
│       ├── jobs/materialize.js  # recurring_rules → real transactions; runs on boot, every 12h, and after rule creation
│       └── utils/dates.js       # monthRange and date helpers
└── frontend/
    ├── Dockerfile
    ├── package.json            # name: hucha-frontend
    ├── vite.config.js          # VITE_API_PROXY → backend:4000
    └── src/
        ├── main.jsx, App.jsx    # routing root
        ├── api/client.js       # the ONLY place fetch() is called (api.get/post/put/patch/del)
        ├── context/ProfileContext.jsx  # active profile id + refetch signal
        ├── components/          # Donut, Modal, NavBar, PeriodNav, ProfileGate, ProfileSwitcher, ProgressLine
        ├── features/
        │   ├── dashboard/ (DashboardView, GoalsPanel)
        │   ├── transactions/ (TransactionsView, TransactionModal)
        │   ├── inbox/ (InboxView)
        │   └── mobile/ (MobileHome, < 640px single-screen)
        ├── hooks/ (useFetch, useIsMobile)
        ├── lib/format.js
        └── styles/global.css   # design tokens + all styling
```

## Boundaries

- **routes stay thin**: parse request, delegate to a service, respond. No SQL or business rules in `routes/`.
- **services own SQL and rules**: the only layer that touches `pool`. Cross-service calls go through each other's exported functions (e.g. `transactions.service.js` imports `createRule`, `materializeRule`, `accountInProfile`, `resolveTagId`).
- **pool is the only DB touchpoint** (`backend/src/db/pool.js`). No ad-hoc `mysql.createConnection` elsewhere.
- **`/api/health`** is defined directly in `app.js` (intentional) — reports `{ ok, db }` without crashing if the DB is unreachable.
- **Automation is decoupled by design**: external feeds post to `POST /api/ingest` (header `x-ingest-token` → `middleware/ingestAuth.js`). Nothing automated writes to `transactions`; it lands in `inbox_entries`, deduped on `(source, external_id)`. A human Approves (→ `source='automated'`) or Rejects in the Inbox view.
- **Frontend fetch is centralized** in `api/client.js`. No component/feature/view may call `fetch()` directly or know hosts/ports — Vite proxies `/api` to the backend via `VITE_API_PROXY`.
- **Profile scoping**: every scoped endpoint lives under `/api/profiles/:profileId/…`. `transactions.profile_id` is denormalized on purpose; switching profiles = one `WHERE profile_id = ?`.
- **No auth**: profiles are query scopes, not identities. Do not introduce auth without explicit instruction.

## Entry Points

- HTTP: API on `:4000` (`backend/src/server.js` → `app.listen` → `scheduleMaterializer()`). Health at `GET /api/health`.
- Frontend: Vite dev server on `:5173` (`frontend/src/main.jsx` → `App.jsx`). Proxies `/api` → backend.
- Ingest: `POST /api/ingest` with `x-ingest-token` header (shared secret `INGEST_TOKEN`).
- DB init: `db/init/{01-schema,02-core-data,03-demo-data}.sql` run in order on first empty-volume boot. `03-demo-data.sql` is optional demo content — delete before first boot for a clean ledger.
- Materializer: `backend/src/jobs/materialize.js`, scheduled on boot + every 12h + immediate run after a rule is created.
- Backups: `db-backup` container, `BACKUP_CRON` (default `0 3 * * *`), retention `BACKUP_RETENTION_DAYS` (default 14).