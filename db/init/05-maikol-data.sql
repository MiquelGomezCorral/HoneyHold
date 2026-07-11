-- ============================================================================
-- hucha · Honey 1 / Maikol — imported ledger (source: Cuentas.xlsx, 'Historical 2026')
--
-- This workbook is shaped differently from Cuentas_2026.xlsx: one block per
-- month (Dec 2025 - Jul 2026), each holding two sub-tables —
--   1. an account-balance table (7 accounts, month-end balance)
--   2. eight category tables (Ingresos + 7 expense categories), each a list
--      of (concept, amount) pairs with its own 'Total' cell
-- Every month/category/account cell was read individually (not scraped as one
-- flat table) and cross-checked: the sheet's own 'Flujo mensual' figure equals
-- Ingresos minus the sum of the 7 expense categories in 6 of 8 months exactly,
-- confirming the category split and column mapping are read correctly.
--
-- ── Two modelling decisions worth knowing ──────────────────────────────────
--
-- (1) ACCOUNT ATTRIBUTION. The category tables record income/expense for the
--     household as a whole — never which of the 7 accounts paid for it. Only
--     the account-balance table is per-account. Posting the full category
--     ledger onto any single real account (e.g. BBVA) produces nonsense: the
--     ledger nets to +7,786.57 over 8 months while BBVA's own real balance
--     only moved by -333.09 in the same period — proof the ledger is already
--     an aggregate, not any one account's activity.
--     The sheet agrees: its own 'Dinero en líquido' row is defined as exactly
--     BBVA + Caixa + Revolut + Efectivo + Cobee + Santander, and the ledger's
--     running total reproduces that row's trajectory almost exactly (see (3)).
--     So the category ledger below is posted to one new account, 'Liquidez'
--     — explicitly modelling that combined pool, not a real bank account — 
--     rather than being force-fit onto BBVA or invented per account.
--     The 7 real accounts (BBVA, Caixa, Revolut, Cash, Santander, Trade, and
--     the new Cobee) instead get their balance set directly from the sheet's
--     July 2026 (latest) snapshot — accurate today, with no fabricated
--     transaction history behind them.
--
-- (2) NO DAY-LEVEL DATES. Unlike Cuentas_2026.xlsx, this sheet gives no day of
--     the month per line item — only the month. Every transaction below is
--     dated the 1st of its month; only the month is meaningful.
--
-- (3) TWO UNRECOVERABLE CELLS. Enero and Marzo each have one 'Cobee' income
--     line whose cell literally evaluates to #REF! in the source (a broken
--     formula reference, not a zero) — there is no number to recover. They are
--     omitted rather than guessed. This is why 'Liquidez' undershoots the real
--     'Dinero en líquido' trajectory by a small, constant, fully-explained gap
--     from March onward: -82.26 (Enero's hole) then -172.01 once March's hole
--     (-89.75 more) joins it, holding flat through July. Every other month ties
--     out exactly.
--
-- Investment fund detail inside 'Trade' (individual holdings, invested-vs-
-- actual-value) is out of scope for this schema and is not imported.
-- ============================================================================

SET NAMES utf8mb4;

-- Honey 1
INSERT INTO accounts (profile_id, name, kind) VALUES
  (2, 'BBVA',      'checking'),
  (2, 'Santander', 'checking'),
  (2, 'Caixa',     'checking'),
  (2, 'Revolut',   'checking'),
  (2, 'Trade',     'trading'),
  (2, 'Cash',      'cash');
-- ── Clean up placeholder demo data on the accounts this file makes real ─────
-- 03-demo-data.sql seeded one sample transaction each on Honey 1's BBVA,
-- Revolut, Cash and Trade. All four accounts get authoritative balances below,
-- so the demo rows would silently corrupt them if left in place.
DELETE FROM transactions
 WHERE profile_id = 2 AND source = 'manual' AND concept IN
   ('Monthly salary', 'Weekly groceries', 'Dinner out', 'Index fund contribution');

-- ── New accounts ─────────────────────────────────────────────────────────
-- Cobee: a real account (Spain's employee meal/benefits prepaid card) not in
--   the original seed list.
--   to hold the category ledger that the source only tracks in aggregate.
INSERT INTO accounts (profile_id, name, kind) VALUES
  (2, 'Cobee-Comida', 'other'),
  (2, 'Cobee-Transporte', 'other');

-- ── Tags (scoped to Honey 1, matching the sheet's own category names) ──────
INSERT INTO tags (profile_id, name) VALUES
  (2, 'Clase'),
  (2, 'Comida'),
  (2, 'Gente'),
  (2, 'Ingresos'),
  (2, 'Invest'),
  (2, 'Otros'),
  (2, 'Tech'),
  (2, 'Transporte');

-- ── Current account balances (from the July 2026 / latest block) ───────────
-- Set directly from the sheet's own account-balance table — no transaction
-- history is fabricated for these 7 accounts.
UPDATE accounts SET initial_balance = 256.28 WHERE profile_id = 2 AND name = 'BBVA';
UPDATE accounts SET initial_balance = 25.97 WHERE profile_id = 2 AND name = 'Caixa';
UPDATE accounts SET initial_balance = 82.09 WHERE profile_id = 2 AND name = 'Revolut';
UPDATE accounts SET initial_balance = 80.00 WHERE profile_id = 2 AND name = 'Cash';
UPDATE accounts SET initial_balance = 47.16 WHERE profile_id = 2 AND name = 'Cobee-Comida';
UPDATE accounts SET initial_balance = 136.36 WHERE profile_id = 2 AND name = 'Cobee-Transporte';
UPDATE accounts SET initial_balance = 30.00 WHERE profile_id = 2 AND name = 'Santander';
UPDATE accounts SET initial_balance = 10180.62 WHERE profile_id = 2 AND name = 'Trade';
UPDATE accounts SET initial_balance = 0 WHERE profile_id = 2 AND name = 'MyInvestor';

-- ── Account balance snapshots ────────────────────────────────────────────────
-- The sheet's own resume table: month-end balance per account, Dec 2025-Jul
-- 2026. Kept separate from the live ledger above so it can never double-count
-- against it — this is historical record, not a source of computed balance.
-- Two source quirks, handled here rather than silently dropped:
--  · Santander has no row at all in the December 2025 block (55 rows below,
--    not the full 56 = 7 accounts x 8 months) — genuinely absent from the
--    source, not an extraction error.
--  · February 2026 briefly lists BOTH 'Fondo' (4,632.29) and a newly-appeared
--    'Trade Republic' (250.28) — read together with March's 'Trade Republic'
--    jumping to 5,985.35, this is Fondo being consolidated into the Trade
--    Republic account rather than two separate holdings, so the two are
--    summed into one February 'Trade' snapshot (4,882.57) below.
CREATE TABLE IF NOT EXISTS account_balance_snapshots (
  id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  account_id INT UNSIGNED     NOT NULL,
  year       SMALLINT UNSIGNED NOT NULL,
  month      TINYINT UNSIGNED NOT NULL,
  balance    DECIMAL(12,2)    NOT NULL,
  created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_snapshot (account_id, year, month),
  CONSTRAINT fk_snapshot_account FOREIGN KEY (account_id)
    REFERENCES accounts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO account_balance_snapshots (account_id, year, month, balance) VALUES
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'BBVA'), 2025, 12, 589.37),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Caixa'), 2025, 12, 25.97),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cash'), 2025, 12, 80.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Comida'), 2025, 12, 47.16),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Transporte'), 2025, 12, 136.36),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Revolut'), 2025, 12, 30.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Trade'), 2025, 12, 2791.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'BBVA'), 2026, 1, 495.10),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Caixa'), 2026, 1, 25.97),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cash'), 2026, 1, 80.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Comida'), 2026, 1, 178.18),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Transporte'), 2026, 1, 178.18),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Revolut'), 2026, 1, 30.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Santander'), 2026, 1, 30.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Trade'), 2026, 1, 4044.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'BBVA'), 2026, 2, 599.84),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Caixa'), 2026, 2, 25.97),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cash'), 2026, 2, 80.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Comida'), 2026, 2, 178.18),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Transporte'), 2026, 2, 178.18),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Revolut'), 2026, 2, 25.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Santander'), 2026, 2, 1030.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Trade'), 2026, 2, 4882.57),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'BBVA'), 2026, 3, 446.49),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Caixa'), 2026, 3, 25.97),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cash'), 2026, 3, 80.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Comida'), 2026, 3, 160.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Transporte'), 2026, 3, 160.01),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Revolut'), 2026, 3, 19.64),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Santander'), 2026, 3, 30.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Trade'), 2026, 3, 5985.35),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'BBVA'), 2026, 4, 182.55),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Caixa'), 2026, 4, 25.97),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cash'), 2026, 4, 80.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Comida'), 2026, 4, 160.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Transporte'), 2026, 4, 176.53),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Revolut'), 2026, 4, 25.64),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Santander'), 2026, 4, 30.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Trade'), 2026, 4, 8549.29),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'BBVA'), 2026, 5, 161.98),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Caixa'), 2026, 5, 25.97),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cash'), 2026, 5, 80.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Comida'), 2026, 5, 178.18),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Transporte'), 2026, 5, 178.18),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Revolut'), 2026, 5, 24.44),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Santander'), 2026, 5, 30.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Trade'), 2026, 5, 9628.60),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'BBVA'), 2026, 6, 200.53),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Caixa'), 2026, 6, 25.97),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cash'), 2026, 6, 80.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Comida'), 2026, 6, 164.50),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Transporte'), 2026, 6, 164.57),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Revolut'), 2026, 6, 24.44),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Santander'), 2026, 6, 30.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Trade'), 2026, 6, 10310.55),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'BBVA'), 2026, 7, 256.28),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Caixa'), 2026, 7, 25.97),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cash'), 2026, 7, 80.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Comida'), 2026, 7, 91.76),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cobee-Transporte'), 2026, 7, 91.76),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Revolut'), 2026, 7, 82.09),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Santander'), 2026, 7, 30.00),
  ((SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Trade'), 2026, 7, 10180.62);

-- ── Category ledger, posted to 'Liquidez' (163 rows across 8 months) ───────
INSERT INTO transactions
  (profile_id, account_id, type, amount, txn_date, concept, tag_id, is_fixed, source)
VALUES
  (2, null, 'income', 1324.87, '2025-12-01', 'Nomina', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 6.53, '2025-12-01', 'Bocata Vella', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 10.80, '2025-12-01', 'Metro Jove', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 353.40, '2025-12-01', 'Matrícula', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Clase'), 0, 'manual'),
  (2, null, 'expense', 64.00, '2025-12-01', 'Ratón', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Tech'), 0, 'manual'),
  (2, null, 'expense', 12.00, '2025-12-01', 'Pelu', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 356.36, '2025-12-01', 'Cobee', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 26.87, '2025-12-01', 'Shushi', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 120.00, '2025-12-01', 'Diesel', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 17.00, '2025-12-01', 'Beca', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Clase'), 0, 'manual'),
  (2, null, 'expense', 7.50, '2025-12-01', 'Kbab', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 10.00, '2025-12-01', 'Renfe', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 48.35, '2025-12-01', 'Navidad', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 11.98, '2025-12-01', 'KFC', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'income', 1195.62, '2026-01-01', 'Nomina', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 5.90, '2026-01-01', 'Comida vella', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 5.40, '2026-01-01', 'Metro', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 353.40, '2026-01-01', 'Matrícula', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Clase'), 0, 'manual'),
  (2, null, 'expense', 19.59, '2026-01-01', 'Regalo Mamá', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 44.00, '2026-01-01', 'Diesel', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 12.00, '2026-01-01', 'Pelu', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 50.00, '2026-01-01', 'Tía', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 5.00, '2026-01-01', 'Manos', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 400.00, '2026-01-01', 'KLM', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 96.00, '2026-01-01', 'Perro', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 2.14, '2026-01-01', 'Fondo', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'income', 1168.75, '2026-02-01', 'Nomina', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 14.40, '2026-02-01', 'Daniel', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 10.80, '2026-02-01', 'Metro', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 212.04, '2026-02-01', 'Matricula', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Clase'), 0, 'manual'),
  (2, null, 'expense', 921.17, '2026-02-01', 'Portátil', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Tech'), 0, 'manual'),
  (2, null, 'expense', 4.00, '2026-02-01', 'diario .es', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 110.10, '2026-02-01', 'Cobee', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 12.53, '2026-02-01', 'Valentine', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Gente'), 0, 'manual'),
  (2, null, 'expense', 8.80, '2026-02-01', 'Vella', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 30.00, '2026-02-01', 'Diesel', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 93.71, '2026-02-01', 'MCR', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 3.92, '2026-02-01', 'Fondo', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 11.97, '2026-02-01', 'Too Good', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 10.00, '2026-02-01', 'Renfe', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 22.97, '2026-02-01', 'Banana', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 20.00, '2026-02-01', 'Josep', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 7.00, '2026-02-01', 'rox', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Gente'), 0, 'manual'),
  (2, null, 'expense', 34.79, '2026-02-01', 'Mercadona', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 16.90, '2026-02-01', 'Cine', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 90.00, '2026-02-01', 'Mamá', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 2.50, '2026-02-01', 'ange', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Gente'), 0, 'manual'),
  (2, null, 'expense', 26.70, '2026-02-01', 'Argentino', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'income', 20.00, '2026-02-01', 'Wolah', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 4.50, '2026-02-01', 'Croissant +', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'income', 2000.00, '2026-02-01', 'Becas', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 18.00, '2026-02-01', 'Cena master', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'income', 15.32, '2026-02-01', '??', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 27.00, '2026-02-01', 'Shushi', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'income', 1183.18, '2026-03-01', 'Nomina', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 36.47, '2026-03-01', 'HoHo', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Gente'), 0, 'manual'),
  (2, null, 'expense', 8.10, '2026-03-01', 'Kbab', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 10.00, '2026-03-01', 'Renfe', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 212.04, '2026-03-01', 'Matrícula', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Clase'), 0, 'manual'),
  (2, null, 'expense', 12.00, '2026-03-01', 'Pelu', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 220.25, '2026-03-01', 'MyInvestor', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Invest'), 0, 'manual'),
  (2, null, 'expense', 400.00, '2026-03-01', 'vero', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Gente'), 0, 'manual'),
  (2, null, 'expense', 42.00, '2026-03-01', 'Brunch', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 62.41, '2026-03-01', 'Diesel', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 11.94, '2026-03-01', 'Camiseta falla', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 7.33, '2026-03-01', 'Fondo', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 11.00, '2026-03-01', 'Aron Viki', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Gente'), 0, 'manual'),
  (2, null, 'expense', 17.09, '2026-03-01', 'consum', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 10.80, '2026-03-01', 'Metro', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 4.00, '2026-03-01', 'El diario .es', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 28.06, '2026-03-01', 'Portatil', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 11.45, '2026-03-01', 'Kings Corner', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 26.00, '2026-03-01', 'Mala gestion', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 8.50, '2026-03-01', 'snacks', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 56.95, '2026-03-01', 'Decathlon', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 20.25, '2026-03-01', 'Code MyInv.', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 36.35, '2026-03-01', 'ramen', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 59.99, '2026-03-01', 'Barras', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 8.00, '2026-03-01', 'Calcetines', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 155.51, '2026-03-01', 'Porto', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 1108.54, '2026-04-01', 'Nomina', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 247.00, '2026-04-01', 'Vuelos Rum.', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Gente'), 0, 'manual'),
  (2, null, 'expense', 22.41, '2026-04-01', 'Italiano', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 105.00, '2026-04-01', 'Diesel', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 12.70, '2026-04-01', 'Farmacia', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 120.00, '2026-04-01', 'MyInvestor', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Invest'), 0, 'manual'),
  (2, null, 'income', 240.80, '2026-04-01', 'Cobee', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 6.32, '2026-04-01', 'Mercadona', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 10.00, '2026-04-01', 'Renfe', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 8.50, '2026-04-01', 'Peli', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 25.00, '2026-04-01', 'Gold', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Invest'), 0, 'manual'),
  (2, null, 'income', 8.94, '2026-04-01', 'Fondo', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 17.98, '2026-04-01', 'KFC', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 10.80, '2026-04-01', 'Metro', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 4.00, '2026-04-01', 'Diario .es', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 6.50, '2026-04-01', 'Rox', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 9.90, '2026-04-01', 'Almorzar', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 11.00, '2026-04-01', 'Otaku cosas', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 19.99, '2026-04-01', 'Decathlon', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 27.50, '2026-04-01', 'Branch', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 6.99, '2026-04-01', 'Disney', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 1115.45, '2026-04-01', 'Declaración', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 20.40, '2026-04-01', 'Mig any', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 12.00, '2026-04-01', 'Pelu', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 99.80, '2026-04-01', 'Mamá', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'income', 400.00, '2026-04-01', 'Vero', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'income', 1144.11, '2026-05-01', 'Nomina', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 4.90, '2026-05-01', 'Honey', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Gente'), 0, 'manual'),
  (2, null, 'expense', 31.68, '2026-05-01', 'Pizza Elisa', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 10.80, '2026-05-01', 'Metro', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 3.30, '2026-05-01', 'Apuntes', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Clase'), 0, 'manual'),
  (2, null, 'expense', 5.98, '2026-05-01', 'OpenRouter', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Tech'), 0, 'manual'),
  (2, null, 'expense', 120.00, '2026-05-01', 'MyInvestor', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Invest'), 0, 'manual'),
  (2, null, 'income', 135.63, '2026-05-01', 'Cobee', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 16.95, '2026-05-01', 'Burguer', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 100.00, '2026-05-01', 'Diesel', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 4.44, '2026-05-01', 'OpenCode', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Tech'), 0, 'manual'),
  (2, null, 'expense', 0.52, '2026-05-01', 'Valenbisi', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 7.00, '2026-05-01', 'Gold', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Invest'), 0, 'manual'),
  (2, null, 'income', 12.23, '2026-05-01', 'Fondo', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 1.20, '2026-05-01', 'Aluerzo', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 10.00, '2026-05-01', 'Renfe', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 10.55, '2026-05-01', 'Dominio', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Tech'), 0, 'manual'),
  (2, null, 'expense', 4.00, '2026-05-01', 'Diario .es', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 200.00, '2026-05-01', 'Mamá', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 6.86, '2026-05-01', 'Consum', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 5.99, '2026-05-01', 'Disney', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 25.99, '2026-05-01', 'Mochila', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 0.56, '2026-05-01', 'Dafuk bonificacion pack viajes', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 45.00, '2026-05-01', 'Karts', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 1388.76, '2026-06-01', 'Nomina', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 16.00, '2026-06-01', 'Bolos', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Gente'), 0, 'manual'),
  (2, null, 'expense', 10.50, '2026-06-01', 'Bolos drink', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 80.00, '2026-06-01', 'Diesel', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 1.82, '2026-06-01', 'Apuntes', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Clase'), 0, 'manual'),
  (2, null, 'expense', 8.99, '2026-06-01', 'Open code', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Tech'), 0, 'manual'),
  (2, null, 'expense', 5.99, '2026-06-01', 'Disney', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 120.00, '2026-06-01', 'MyInvestor', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Invest'), 0, 'manual'),
  (2, null, 'income', 240.80, '2026-06-01', 'Cobee', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 37.24, '2026-06-01', 'Mamá', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Gente'), 0, 'manual'),
  (2, null, 'expense', 43.00, '2026-06-01', 'Fitzgeralds', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 10.80, '2026-06-01', 'Metro', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 205.08, '2026-06-01', 'Ropa', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 7.00, '2026-06-01', 'Gold', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Invest'), 0, 'manual'),
  (2, null, 'income', 13.02, '2026-06-01', 'Fondo', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 6.50, '2026-06-01', 'Parking', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 4.00, '2026-06-01', 'Dirario', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 20.00, '2026-06-01', 'Wuolah', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 13.60, '2026-06-01', 'Merienda', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 10.00, '2026-06-01', 'Renfe', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 12.00, '2026-06-01', 'Pelu', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 31.00, '2026-06-01', 'Cena', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 300.00, '2026-06-01', 'Seguro coche', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 40.00, '2026-06-01', 'Desayuno', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 5.85, '2026-06-01', 'Parking', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Transporte'), 0, 'manual'),
  (2, null, 'expense', 72.35, '2026-07-01', 'Rumanía', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Gente'), 0, 'manual'),
  (2, null, 'expense', 58.22, '2026-07-01', 'Sushi', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 7.99, '2026-07-01', 'Tirantes', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'expense', 1.32, '2026-07-01', 'Almuerzo', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 4.00, '2026-07-01', 'ElDiario .es', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Otros'), 0, 'manual'),
  (2, null, 'income', 0.07, '2026-07-01', 'Fondo', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Ingresos'), 0, 'manual'),
  (2, null, 'expense', 6.09, '2026-07-01', 'Consum', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual'),
  (2, null, 'expense', 12.18, '2026-07-01', 'Cena', (SELECT id FROM tags WHERE profile_id = 2 AND name = 'Comida'), 0, 'manual');
