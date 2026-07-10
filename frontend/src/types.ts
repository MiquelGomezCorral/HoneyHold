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
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  txn_date: string;
  concept: string;
  counterparty: string | null;
  tag_name: string | null;
  account_name: string;
  is_fixed: number;
  source: string;
}

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
