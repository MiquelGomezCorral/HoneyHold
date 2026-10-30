import { createHash, randomBytes, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/errors.js';
import { ingestItems } from './ingest.service.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

const API_ORIGIN = 'https://api.enablebanking.com';
const CONSENT_SECONDS = 90 * 24 * 60 * 60;
const REAUTHORIZE_BEFORE_MS = 7 * 24 * 60 * 60 * 1000;
const CONFIG_PATH = path.resolve(process.cwd(), 'config/enable-banking.accounts.json');
const SCHEMA_PATH = path.resolve(process.cwd(), '../db/init/06-enable-banking.sql');

interface AccountMapping {
  aspsp_name: string;
  country: string;
  profile_slug: string;
  account_name: string;
}

interface ConnectionRow extends RowDataPacket {
  id: number;
  profile_id: number;
  account_id: number;
  profile_slug: string;
  account_name: string;
  aspsp_name: string;
  aspsp_country: string;
  session_id: string | null;
  account_uid: string | null;
  account_fingerprint: string | null;
  consent_valid_until: string | null;
  pending_state_hash: string | null;
  status: string;
  last_successful_fetch_at: string | null;
  last_completed_slot_at: string | null;
  last_error: string | null;
}

interface Aspsp {
  name: string;
  country: string;
  maximum_consent_validity: number;
}

interface EnableAccount {
  uid: string;
  currency: string;
  identification_hash: string;
}

interface SessionResponse {
  session_id: string;
  accounts: EnableAccount[];
  access: { valid_until: string };
}

interface EnableTransaction extends Record<string, unknown> {
  entry_reference?: string;
  status?: string;
  booking_date?: string;
  transaction_date?: string;
  value_date?: string;
  credit_debit_indicator?: string;
  transaction_amount?: { amount?: string; currency?: string };
  remittance_information?: string[];
  note?: string;
  bank_transaction_code?: { description?: string };
  debtor?: { name?: string };
  creditor?: { name?: string };
  reference_number?: string;
}

interface TransactionsResponse {
  transactions: EnableTransaction[];
  continuation_key?: string | null;
}

class EnableBankingError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

let privateKey: Buffer | undefined;

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function dbDate(date: Date): string {
  return date.toISOString().slice(0, 23).replace('T', ' ');
}

function parseDbDate(value: string): Date {
  return new Date(`${value.replace(' ', 'T').replace(/\.\d+$/, '')}Z`);
}

function jwtHeaders(): Record<string, string> {
  if (!env.enableBanking.appId) throw new HttpError(503, 'Enable Banking is not configured');
  privateKey ??= readFileSync(env.enableBanking.privateKeyPath);

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'RS256', kid: env.enableBanking.appId })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'enablebanking.com',
    aud: 'api.enablebanking.com',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');
  const signature = sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), privateKey).toString('base64url');

  return {
    Authorization: `Bearer ${header}.${payload}.${signature}`,
    Accept: 'application/json',
  };
}

async function enableRequest<T>(
  method: string,
  pathname: string,
  options: { query?: Record<string, string>; body?: unknown } = {},
): Promise<T> {
  const url = new URL(pathname, API_ORIGIN);
  for (const [key, value] of Object.entries(options.query ?? {})) url.searchParams.set(key, value);

  const response = await fetch(url, {
    method,
    headers: {
      ...jwtHeaders(),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as {
      code?: string;
      error?: string;
      message?: string;
      detail?: string;
    };
    throw new EnableBankingError(
      body.message || body.detail || `Enable Banking request failed with ${response.status}`,
      response.status,
      body.code || body.error,
    );
  }

  return response.json() as Promise<T>;
}

function loadMappings(): AccountMapping[] {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as AccountMapping[];
}

async function connectionById(id: number): Promise<ConnectionRow> {
  const [rows] = await pool.query<ConnectionRow[]>(
    `SELECT c.*, p.slug AS profile_slug, a.name AS account_name
       FROM enable_banking_connections c
       JOIN profiles p ON p.id = c.profile_id
       JOIN accounts a ON a.id = c.account_id
      WHERE c.id = ?`,
    [id],
  );
  if (!rows.length) throw new HttpError(404, 'Enable Banking connection not found');
  return rows[0];
}

export async function initializeConnections(): Promise<void> {
  await pool.query(readFileSync(SCHEMA_PATH, 'utf8'));

  for (const mapping of loadMappings()) {
    try {
      const [accounts] = await pool.query<RowDataPacket[]>(
        `SELECT a.id AS account_id, p.id AS profile_id
           FROM accounts a
           JOIN profiles p ON p.id = a.profile_id
          WHERE p.slug = ? AND a.name = ? AND a.is_active = 1`,
        [mapping.profile_slug, mapping.account_name],
      );
      if (!accounts.length) {
        throw new Error(`Unknown HoneyHold account ${mapping.profile_slug}/${mapping.account_name}`);
      }

      await pool.query<ResultSetHeader>(
        `INSERT IGNORE INTO enable_banking_connections
           (profile_id, account_id, aspsp_name, aspsp_country)
         VALUES (?, ?, ?, ?)`,
        [accounts[0].profile_id, accounts[0].account_id, mapping.aspsp_name, mapping.country],
      );
    } catch (error) {
      console.warn(
        `[enable-banking] skipped ${mapping.aspsp_name}/${mapping.account_name}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function allConnections(): Promise<ConnectionRow[]> {
  const [rows] = await pool.query<ConnectionRow[]>(
    `SELECT c.*, p.slug AS profile_slug, a.name AS account_name
       FROM enable_banking_connections c
       JOIN profiles p ON p.id = c.profile_id
       JOIN accounts a ON a.id = c.account_id
      ORDER BY c.id`,
  );
  const configured = new Set(loadMappings().map((mapping) =>
    [mapping.aspsp_name, mapping.country, mapping.profile_slug, mapping.account_name].join('\0')));
  return rows.filter((connection) => configured.has([
    connection.aspsp_name,
    connection.aspsp_country,
    connection.profile_slug,
    connection.account_name,
  ].join('\0')));
}

function needsAuthorization(connection: ConnectionRow): boolean {
  if (connection.status !== 'authorized' || !connection.consent_valid_until) return true;
  return parseDbDate(connection.consent_valid_until).getTime() <= Date.now() + REAUTHORIZE_BEFORE_MS;
}

export async function listConnections() {
  return (await allConnections()).map((connection) => ({
    id: connection.id,
    aspsp_name: connection.aspsp_name,
    country: connection.aspsp_country,
    profile_slug: connection.profile_slug,
    account_name: connection.account_name,
    status: connection.status,
    valid_until: connection.consent_valid_until,
    last_successful_fetch_at: connection.last_successful_fetch_at,
    last_error: connection.last_error,
    authorization_pending: Boolean(connection.pending_state_hash),
    needs_authorization: needsAuthorization(connection),
  }));
}

async function getAspsp(connection: ConnectionRow): Promise<Aspsp> {
  const data = await enableRequest<{ aspsps: Aspsp[] }>('GET', '/aspsps', {
    query: { country: connection.aspsp_country, psu_type: 'personal', service: 'AIS' },
  });
  const match = data.aspsps.find((item) => item.name.toLowerCase() === connection.aspsp_name.toLowerCase());
  if (!match) throw new Error(`Enable Banking provider not found: ${connection.aspsp_name} ${connection.aspsp_country}`);
  return match;
}

export async function startAuthorization(connectionId: number) {
  const connection = await connectionById(connectionId);
  const aspsp = await getAspsp(connection);
  const state = randomBytes(32).toString('base64url');
  const validSeconds = Math.min(CONSENT_SECONDS, aspsp.maximum_consent_validity) - 60;
  const authorization = await enableRequest<{ url: string }>('POST', '/auth', {
    body: {
      access: { valid_until: new Date(Date.now() + validSeconds * 1000).toISOString() },
      aspsp: { name: aspsp.name, country: aspsp.country },
      state,
      redirect_url: env.enableBanking.redirectUrl,
      psu_type: 'personal',
    },
  });

  await pool.query<ResultSetHeader>(
    `UPDATE enable_banking_connections
        SET pending_state_hash = ?, pending_state_expires_at = ?,
            status = CASE
              WHEN session_id IS NOT NULL AND consent_valid_until > UTC_TIMESTAMP(6)
                THEN 'authorized'
              ELSE 'pending'
            END,
            last_error = NULL
      WHERE id = ?`,
    [hash(state), dbDate(new Date(Date.now() + 15 * 60 * 1000)), connection.id],
  );

  return { url: authorization.url };
}

export async function completeAuthorization(state: string, code: string): Promise<void> {
  const stateHash = hash(state);
  const [rows] = await pool.query<ConnectionRow[]>(
    `SELECT c.*, p.slug AS profile_slug, a.name AS account_name
       FROM enable_banking_connections c
       JOIN profiles p ON p.id = c.profile_id
       JOIN accounts a ON a.id = c.account_id
      WHERE c.pending_state_hash = ? AND c.pending_state_expires_at > UTC_TIMESTAMP(6)`,
    [stateHash],
  );
  if (!rows.length) throw new HttpError(400, 'Invalid or expired authorization state');
  const connection = rows[0];

  try {
    const session = await enableRequest<SessionResponse>('POST', '/sessions', { body: { code } });
    const euroAccounts = session.accounts.filter((account) => account.currency === 'EUR');
    const account = connection.account_fingerprint
      ? euroAccounts.find((item) => hash(item.identification_hash) === connection.account_fingerprint)
      : euroAccounts[0];
    if (!account?.identification_hash) throw new Error('No matching EUR account was returned');

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE enable_banking_connections
          SET session_id = ?, account_uid = ?, account_fingerprint = ?,
              consent_valid_until = ?, status = 'authorized',
              pending_state_hash = NULL, pending_state_expires_at = NULL,
              last_error = NULL
        WHERE id = ? AND pending_state_hash = ?`,
      [
        session.session_id,
        account.uid,
        hash(account.identification_hash),
        dbDate(new Date(session.access.valid_until)),
        connection.id,
        stateHash,
      ],
    );
    if (!result.affectedRows) throw new HttpError(409, 'Authorization was already completed');
  } catch (error) {
    await pool.query<ResultSetHeader>(
      `UPDATE enable_banking_connections
          SET status = CASE
                WHEN session_id IS NOT NULL AND consent_valid_until > UTC_TIMESTAMP(6)
                  THEN 'authorized'
                ELSE 'error'
              END,
              pending_state_hash = NULL,
              pending_state_expires_at = NULL, last_error = ?
        WHERE id = ? AND pending_state_hash = ?`,
      [
        error instanceof Error ? error.message.slice(0, 512) : 'Authorization failed',
        connection.id,
        stateHash,
      ],
    );
    throw error;
  }
}

export async function failAuthorization(state: string, message: string): Promise<void> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE enable_banking_connections
        SET status = CASE
              WHEN session_id IS NOT NULL AND consent_valid_until > UTC_TIMESTAMP(6)
                THEN 'authorized'
              ELSE 'error'
            END,
            pending_state_hash = NULL,
            pending_state_expires_at = NULL, last_error = ?
      WHERE pending_state_hash = ? AND pending_state_expires_at > UTC_TIMESTAMP(6)`,
    [message.slice(0, 512), hash(state)],
  );
  if (!result.affectedRows) throw new HttpError(400, 'Invalid or expired authorization state');
}

function transactionDate(transaction: EnableTransaction): string {
  const date = transaction.booking_date || transaction.transaction_date || transaction.value_date;
  if (!date) throw new Error('Booked transaction has no date');
  return date;
}

function transactionConcept(transaction: EnableTransaction): string {
  const remittance = transaction.remittance_information?.join(' | ');
  return (remittance || transaction.note || transaction.bank_transaction_code?.description || 'Bank transaction').slice(0, 255);
}

function transactionExternalId(transaction: EnableTransaction, accountFingerprint: string): string {
  const identity = transaction.entry_reference || JSON.stringify({
    date: transactionDate(transaction),
    amount: transaction.transaction_amount,
    direction: transaction.credit_debit_indicator,
    remittance: transaction.remittance_information,
    debtor: transaction.debtor?.name,
    creditor: transaction.creditor?.name,
    reference: transaction.reference_number,
  });
  return hash(`${accountFingerprint}:${identity}`);
}

function ingestItem(transaction: EnableTransaction, connection: ConnectionRow) {
  const direction = transaction.credit_debit_indicator;
  if (direction !== 'CRDT' && direction !== 'DBIT') throw new Error(`Unsupported transaction direction ${direction}`);
  const amount = Number(transaction.transaction_amount?.amount);
  if (!Number.isFinite(amount) || amount === 0) throw new Error('Booked transaction has an invalid amount');

  return {
    source: 'enable-banking',
    external_id: transactionExternalId(transaction, connection.account_fingerprint!),
    amount: Math.abs(amount),
    date: transactionDate(transaction),
    concept: transactionConcept(transaction),
    counterparty: (direction === 'CRDT' ? transaction.debtor?.name : transaction.creditor?.name)?.slice(0, 128),
    type: direction === 'CRDT' ? 'income' : 'expense',
    profile_slug: connection.profile_slug,
    account_name: connection.account_name,
    raw: transaction,
  };
}

async function fetchTransactions(connection: ConnectionRow): Promise<EnableTransaction[]> {
  const since = connection.last_successful_fetch_at
    ? new Date(parseDbDate(connection.last_successful_fetch_at).getTime() - 24 * 60 * 60 * 1000)
    : new Date(Date.now() - 6 * 60 * 60 * 1000);
  const query: Record<string, string> = {
    date_from: since.toISOString().slice(0, 10),
    date_to: new Date().toISOString().slice(0, 10),
    transaction_status: 'BOOK',
  };
  const transactions: EnableTransaction[] = [];
  const continuationKeys = new Set<string>();

  while (true) {
    const page = await enableRequest<TransactionsResponse>(
      'GET',
      `/accounts/${connection.account_uid}/transactions`,
      { query },
    );
    transactions.push(...page.transactions);
    if (!page.continuation_key) return transactions;
    if (continuationKeys.has(page.continuation_key)) throw new Error('Enable Banking repeated a continuation key');
    continuationKeys.add(page.continuation_key);
    query.continuation_key = page.continuation_key;
  }
}

export async function fetchConnection(connectionId: number, slotAt: Date): Promise<number> {
  const connection = await connectionById(connectionId);
  if (connection.status !== 'authorized' || !connection.session_id || !connection.account_uid || !connection.account_fingerprint) {
    return 0;
  }
  if (!connection.consent_valid_until || parseDbDate(connection.consent_valid_until).getTime() <= Date.now()) {
    await pool.query("UPDATE enable_banking_connections SET status = 'expired' WHERE id = ?", [connection.id]);
    return 0;
  }

  await pool.query(
    'UPDATE enable_banking_connections SET last_fetch_attempt_at = UTC_TIMESTAMP(6) WHERE id = ?',
    [connection.id],
  );

  try {
    const transactions = await fetchTransactions(connection);
    if (transactions.length) await ingestItems(transactions.map((transaction) => ingestItem(transaction, connection)));

    await pool.query<ResultSetHeader>(
      `UPDATE enable_banking_connections
          SET last_successful_fetch_at = UTC_TIMESTAMP(6), last_completed_slot_at = ?,
              last_error = NULL
        WHERE id = ?`,
      [dbDate(slotAt), connection.id],
    );
    return transactions.length;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 512) : 'Fetch failed';
    const expired = error instanceof EnableBankingError && /EXPIRED|INVALID_SESSION|SESSION_NOT_FOUND/.test(error.code || '');
    await pool.query<ResultSetHeader>(
      `UPDATE enable_banking_connections
          SET status = ?, last_error = ?
        WHERE id = ?`,
      [expired ? 'expired' : connection.status, message, connection.id],
    );
    throw error;
  }
}

export async function fetchSlot(slotAt: Date): Promise<void> {
  for (const connection of await allConnections()) {
    if (connection.status !== 'authorized') continue;
    if (connection.last_completed_slot_at
      && parseDbDate(connection.last_completed_slot_at).getTime() >= slotAt.getTime()) continue;
    try {
      const count = await fetchConnection(connection.id, slotAt);
      console.log(`[enable-banking] ${connection.aspsp_name}: fetched ${count} transaction(s)`);
    } catch (error) {
      console.warn(`[enable-banking] ${connection.aspsp_name} failed:`, error instanceof Error ? error.message : error);
    }
  }
}
