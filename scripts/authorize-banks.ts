const apiOrigin = process.env.ENABLE_BANKING_BACKEND_URL || 'http://localhost:4000';
const token = process.env.INGEST_TOKEN;
const forceAll = process.argv.includes('--all');

if (!token) throw new Error('INGEST_TOKEN is not configured');

interface Connection {
  id: number;
  aspsp_name: string;
  country: string;
  account_name: string;
  status: string;
  valid_until: string | null;
  last_error: string | null;
  authorization_pending: boolean;
  needs_authorization: boolean;
}

async function api<T>(pathname: string, method = 'GET'): Promise<T> {
  const response = await fetch(`${apiOrigin}${pathname}`, {
    method,
    headers: { 'x-ingest-token': token! },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error || `Backend returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function connections(): Promise<Connection[]> {
  return api('/api/enable-banking/connections');
}

async function waitForAuthorization(id: number): Promise<void> {
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    await Bun.sleep(2000);
    const connection = (await connections()).find((item) => item.id === id);
    if (!connection) throw new Error('Connection disappeared');
    if (connection.authorization_pending) continue;
    if (connection.last_error) throw new Error(connection.last_error);
    if (connection.status === 'authorized') return;
    throw new Error('Authorization failed');
  }
  throw new Error('Authorization timed out');
}

const targets = (await connections()).filter((connection) => forceAll || connection.needs_authorization);
if (!targets.length) {
  console.log('All bank connections are authorized for more than seven days.');
  process.exit(0);
}

let failed = false;
for (const connection of targets) {
  try {
    const authorization = await api<{ url: string }>(
      `/api/enable-banking/connections/${connection.id}/authorize`,
      'POST',
    );
    console.log(`\nAuthorize ${connection.aspsp_name} (${connection.account_name}):`);
    console.log(authorization.url);
    await waitForAuthorization(connection.id);
    console.log(`${connection.aspsp_name} connected.`);
  } catch (error) {
    failed = true;
    console.error(`${connection.aspsp_name} failed:`, error instanceof Error ? error.message : error);
  }
}

if (failed) process.exitCode = 1;
