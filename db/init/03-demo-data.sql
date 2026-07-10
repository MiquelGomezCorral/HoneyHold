-- ============================================================================

SET NAMES utf8mb4;
-- HoneyHold · demo data (OPTIONAL — delete this file for a clean start)
-- A few transactions per profile, one recurring rule, two pending inbox
-- entries, so every view has content on first boot.
-- ============================================================================

-- Honey 1 ────────────────────────────────────────────────────────────────────
INSERT INTO transactions (profile_id, account_id, type, amount, txn_date, concept, counterparty, tag_id, is_fixed) VALUES
  (2, (SELECT id FROM accounts WHERE profile_id = 2 AND name = 'BBVA'),
      'income', 2100.00, DATE_FORMAT(CURDATE(), '%Y-%m-01'),
      'Monthly salary', 'Acme S.L.',
      (SELECT id FROM tags WHERE name = 'Salary' AND profile_id IS NULL), 1),
  (2, (SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Revolut'),
      'expense', 64.30, DATE_SUB(CURDATE(), INTERVAL 2 DAY),
      'Weekly groceries', 'Mercadona',
      (SELECT id FROM tags WHERE name = 'Groceries' AND profile_id IS NULL), 0),
  (2, (SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Cash'),
      'expense', 28.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY),
      'Dinner out', 'La Taberna',
      (SELECT id FROM tags WHERE name = 'Leisure' AND profile_id IS NULL), 0),
  (2, (SELECT id FROM accounts WHERE profile_id = 2 AND name = 'Trade'),
      'expense', 150.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY),
      'Index fund contribution', 'Broker',
      (SELECT id FROM tags WHERE name = 'Investments' AND profile_id IS NULL), 0);

-- Honey 2 ────────────────────────────────────────────────────────────────────
INSERT INTO transactions (profile_id, account_id, type, amount, txn_date, concept, counterparty, tag_id, is_fixed) VALUES
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'),
      'income', 1950.00, DATE_FORMAT(CURDATE(), '%Y-%m-01'),
      'Monthly salary', 'Studio XYZ',
      (SELECT id FROM tags WHERE name = 'Salary' AND profile_id IS NULL), 1),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Imagine'),
      'expense', 39.90, DATE_SUB(CURDATE(), INTERVAL 3 DAY),
      'Gym membership', 'FitClub',
      (SELECT id FROM tags WHERE name = 'Health' AND profile_id IS NULL), 0);

-- Shared ─────────────────────────────────────────────────────────────────────
INSERT INTO transactions (profile_id, account_id, type, amount, txn_date, concept, counterparty, tag_id, is_fixed) VALUES
  (1, (SELECT id FROM accounts WHERE profile_id = 1 AND name = 'Joint account'),
      'income', 800.00, DATE_FORMAT(CURDATE(), '%Y-%m-01'),
      'Monthly joint contribution', 'Both',
      (SELECT id FROM tags WHERE name = 'Other' AND profile_id IS NULL), 0),
  (1, (SELECT id FROM accounts WHERE profile_id = 1 AND name = 'Joint account'),
      'expense', 92.15, DATE_SUB(CURDATE(), INTERVAL 4 DAY),
      'Electricity bill', 'Iberdrola',
      (SELECT id FROM tags WHERE name = 'Utilities' AND profile_id IS NULL), 1);

-- A recurring rule: rent, monthly, from the 1st of the current month.
-- The backend materializer turns due rules into real transactions on boot.
INSERT INTO recurring_rules (profile_id, account_id, type, amount, concept, counterparty, tag_id, frequency, start_date, next_due) VALUES
  (1, (SELECT id FROM accounts WHERE profile_id = 1 AND name = 'Joint account'),
      'expense', 950.00, 'Rent', 'Landlord',
      (SELECT id FROM tags WHERE name = 'Rent' AND profile_id IS NULL),
      'monthly', DATE_FORMAT(CURDATE(), '%Y-%m-01'), DATE_FORMAT(CURDATE(), '%Y-%m-01'));

-- Two pending inbox entries, as if pushed by an Open Banking connector.
INSERT INTO inbox_entries (source, external_id, profile_id, account_id, suggested_type, amount, txn_date, concept, counterparty, raw_payload) VALUES
  ('demo-bank', 'demo-0001', 2,
      (SELECT id FROM accounts WHERE profile_id = 2 AND name = 'BBVA'),
      'expense', 12.50, DATE_SUB(CURDATE(), INTERVAL 1 DAY),
      'CARD PURCHASE 4821 FARMACIA', 'Farmacia Central',
      '{"provider": "demo-bank", "iban": "ES91...0418", "mcc": "5912"}'),
  ('demo-bank', 'demo-0002', NULL, NULL,
      'income', 55.00, CURDATE(),
      'TRANSFER RECEIVED — BIZUM', 'M. García',
      '{"provider": "demo-bank", "channel": "bizum"}');
