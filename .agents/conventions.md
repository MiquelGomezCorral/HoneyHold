# Conventions

## Code Style

- ESM throughout: both `backend/package.json` and `frontend/package.json` set `"type": "module"`. Use `import`/`export`, not `require`.
- 2-space indent, single quotes for JS strings, trailing commas in multiline literals (inferred from existing source).
- Express handlers wrap async in `asyncH` (`backend/src/middleware/errors.js`); throw `HttpError(status, message)` for client errors. `errorHandler` renders `{ error }` JSON.
- SQL is hand-written, lowercase keywords, parameterized with `?` placeholders. Dynamic `WHERE` clauses are built as `where[]` + `params[]` arrays, joined at the end (see `transactions.service.js`).
- Frontend styling is one file: `frontend/src/styles/global.css` with design tokens. No CSS-in-JS, no Tailwind. Reuse tokens/classes; do not add a stylesheet per component.
- Comments are sparse and explain "why", not "what" (see `api/client.js` header comment, schema section banners). Default: no comments.

## Naming

- Files: `kebab-case` for modules (`transactions.service.js`, `ProfileContext.jsx` is the established JSX exception). Routes: `<domain>.routes.js`. Services: `<domain>.service.js`.
- Export style: backend services use `export async function name(...)`; frontend React components are default exports.
- DB: `snake_case` identifiers. Tables plural (`profiles`, `accounts`, `transactions`); FK columns `<table_singular>_id` (`profile_id`, `account_id`, `recurring_rule_id`). Unique keys `uq_<table>_<cols>`.
- URLs: scoped routes under `/api/profiles/:profileId/...`. Ingest is the exception at `/api/ingest`.

## Imports

- Backend: absolute-ish via relative paths (`../db/pool.js`, `../services/transactions.service.js`). No path aliases configured.
- Frontend: relative imports. `api/client.js` exports the single `api` object; features import `useFetch` from `../hooks/useFetch` and `api` from `../api/client`. No bare-specifier aliases.
- Node built-ins and npm packages first, then local modules (inferred; keep stable).

## Tests

None yet. No test runner, no `test` script, no `*.test.*` files. No lint/format config present either. If adding tests, pick a runner that fits the existing ESM + no-build-tooling style and wire a `test` script into both `package.json` files.