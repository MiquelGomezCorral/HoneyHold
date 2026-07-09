// Pretends to be an Open Banking connector: pushes a few raw bank movements
// to POST /api/ingest, where they wait in the Inbox for human triage.
//
//   docker compose exec backend node scripts/simulate-bank-feed.js
//
// From the host instead: INGEST_URL=http://localhost:4000/api/ingest node scripts/simulate-bank-feed.js
const url = process.env.INGEST_URL || 'http://localhost:4000/api/ingest';
const token = process.env.INGEST_TOKEN || 'dev-ingest-token';
const today = new Date().toISOString().slice(0, 10);
const batch = Date.now();

const items = [
  {
    source: 'demo-bank',
    external_id: `sim-${batch}-1`,
    profile_slug: 'honey-1',
    account_name: 'BBVA',
    amount: -23.4, // negative → normalized to an expense
    date: today,
    concept: 'CARD PURCHASE 4821 SUPERMARKET',
    counterparty: 'Consum',
    raw: { channel: 'card' },
  },
  {
    source: 'demo-bank',
    external_id: `sim-${batch}-2`,
    profile_slug: 'honey-2',
    account_name: 'Imagine',
    amount: -9.99,
    date: today,
    concept: 'SUBSCRIPTION STREAMFLIX',
    counterparty: 'Streamflix',
    raw: { channel: 'direct-debit' },
  },
  {
    source: 'demo-bank',
    external_id: `sim-${batch}-3`,
    amount: 120, // no profile hint → lands unassigned, any profile can triage it
    date: today,
    concept: 'TRANSFER RECEIVED',
    counterparty: 'J. Pérez',
    raw: { channel: 'sepa' },
  },
];

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-ingest-token': token },
  body: JSON.stringify(items),
});
console.log(res.status, await res.json());
