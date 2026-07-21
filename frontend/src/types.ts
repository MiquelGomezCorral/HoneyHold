export interface Profile {
  id: number;
  slug: string;
  display_name: string;
}

export interface Account {
  id: number;
  name: string;
  kind: string;
  balance: number;
  profile_id?: number;
  profile_name?: string;
}

export interface Tag {
  id: number;
  name: string;
  profile_id: number | null;
  usage_count: number;
  protected: boolean;
}

export type EntryType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  txn_date: string;
  created_at: string;
  concept: string;
  counterparty: string | null;
  account_id: number | null;
  tag_name: string | null;
  account_name: string;
  account_profile_id: number | null;
  account_profile_name: string | null;
  is_fixed: number;
  source: string;
}

export interface Transfer {
  id: number;
  type: 'transfer';
  amount: number;
  txn_date: string;
  created_at: string;
  concept: string;
  source: string;
  creator_profile_id: number;
  from_account_id: number;
  from_account_name: string;
  from_profile_id: number;
  from_profile_name: string;
  to_account_id: number;
  to_account_name: string;
  to_profile_id: number;
  to_profile_name: string;
  tag_name: string | null;
}

export type LedgerEntry = Transaction | Transfer;

export interface RecurringRule {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  concept: string;
  frequency: string;
  account_name: string;
  next_due: string;
}

export interface InboxEntry {
  id: number;
  source: string;
  amount: number;
  txn_date: string;
  concept: string;
  counterparty: string;
  account_id: number;
  suggested_type: string | null;
  profile_id: number | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardData {
  accounts: Account[];
  totalBalance: number;
  month: { income: number; expense: number; net: number };
  fixedVsVariable: { label: string; value: number }[];
  byTag: { label: string; value: number }[];
  goals: {
    monthly: { actual: number; target: number | null };
    annual: { actual: number; target: number | null };
  };
}

export interface DonutSlice {
  label: string;
  value: number;
}
