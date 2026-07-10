-- ============================================================================

SET NAMES utf8mb4;
-- HoneyHold · core data (required)
-- The three profiles and their accounts, global tags, starter goals.
-- ============================================================================

INSERT INTO profiles (id, slug, display_name) VALUES
  (1, 'shared',  'Shared'),
  (2, 'honey-1', 'Honey 1'),
  (3, 'honey-2', 'Honey 2');

-- Shared
INSERT INTO accounts (profile_id, name, kind) VALUES
  (1, 'Joint account',  'checking'),
  (1, 'Household cash', 'cash');

-- Honey 1
INSERT INTO accounts (profile_id, name, kind) VALUES
  (2, 'BBVA',      'checking'),
  (2, 'Santander', 'checking'),
  (2, 'Caixa',     'checking'),
  (2, 'Revolut',   'checking'),
  (2, 'Trade',     'trading'),
  (2, 'Cash',      'cash');

-- Honey 2
INSERT INTO accounts (profile_id, name, kind) VALUES
  (3, 'Santander', 'checking'),
  (3, 'Imagine',   'checking');

-- Global tags (profile_id NULL → visible to every profile)
INSERT INTO tags (profile_id, name) VALUES
  (NULL, 'Salary'),
  (NULL, 'Groceries'),
  (NULL, 'Rent'),
  (NULL, 'Utilities'),
  (NULL, 'Transport'),
  (NULL, 'Leisure'),
  (NULL, 'Health'),
  (NULL, 'Investments'),
  (NULL, 'Other');

-- Starter goals for the current year (editable from the dashboard)
INSERT INTO goals (profile_id, period, year, target_amount) VALUES
  (1, 'monthly', YEAR(CURDATE()),  300.00),
  (1, 'annual',  YEAR(CURDATE()), 3600.00),
  (2, 'monthly', YEAR(CURDATE()),  400.00),
  (2, 'annual',  YEAR(CURDATE()), 5000.00),
  (3, 'monthly', YEAR(CURDATE()),  400.00),
  (3, 'annual',  YEAR(CURDATE()), 5000.00);
