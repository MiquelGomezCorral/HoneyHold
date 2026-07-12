-- ============================================================================
-- hucha · Honey 2 / Santander — imported ledger (source: Cuentas_2026.xlsx)
--
-- Scraped from the user's spreadsheet:
--   · 'Resumen Mensual' -> opening balance and the annual savings target
--   · 'Ingresos'        -> 61 income rows   (Jan-Jul 2026)
--   · 'Gastos'          -> 113 expense rows (Jan-Jul 2026)
--
-- Every monthly income/expense total in 'Resumen Mensual' was cross-checked
-- against the sum of the corresponding rows in 'Ingresos'/'Gastos' and matches
-- exactly (Jan-Jul: income 10,035.33 / expense 3,773.87 — see report below).
--
-- Tags are created scoped to Honey 2 (profile_id = 3), reusing the sheet's own
-- Spanish categories (its 'Tipo' column) rather than remapping them onto the
-- English global tags seeded in 02-core-data.sql, to keep the categorisation
-- the user already uses intact.
--
-- Not carried over: the sheet's monthly savings goal is a *percentage* of
-- income (constant 50% every month), which the `goals` table can't represent
-- (it stores a flat euro target). Only the explicit euro figure — the annual
-- target of 15,000 -- is applied below. The monthly euro goal seeded earlier
-- (400) is left untouched; revisit if/when goals gains a percentage mode.
-- ============================================================================

SET NAMES utf8mb4;


-- Honey 2
INSERT INTO accounts (profile_id, name, kind) VALUES
  (3, 'Santander', 'checking'),
  (3, 'Imagine',   'checking');
-- ── Clean up placeholder demo data on this account ──────────────────────
-- 03-demo-data.sql seeded one sample transaction on Honey 2 / Santander
-- ('Monthly salary' from 'Studio XYZ') purely so the dashboard had content
-- before real data existed. It would double-count against the real ledger
-- below, so it's removed here. (If 03-demo-data.sql was deleted before
-- first boot, as its own header suggests, this simply matches 0 rows.)
DELETE FROM transactions
 WHERE profile_id = 3
   AND account_id = (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander')
   AND source = 'manual'
   AND concept = 'Monthly salary'
   AND counterparty = 'Studio XYZ';

-- ── Tags (scoped to Honey 2) ─────────────────────────────────────────────
-- INSERT INTO tags (profile_id, name) VALUES
--   (3, 'Belleza'),

-- ── Opening balance ──────────────────────────────────────────────────────
-- 'Resumen Mensual'!F2: balance carried into January 2026, before any of the
-- transactions below. Combined with those transactions this reproduces every
-- monthly 'Saldo acumulado' in the sheet (e.g. 6979.38 + 1136.48 = 8115.86 for
-- January, matching the sheet exactly).
UPDATE accounts SET initial_balance = 6979.38
 WHERE profile_id = 3 AND name = 'Santander';

-- ── Annual savings target ────────────────────────────────────────────────
-- 'Resumen Mensual'!B29 ('OBJETIVO'): explicit euro target for 2026.
INSERT INTO goals (profile_id, period, year, target_amount)
VALUES (3, 'annual', 2026, 15000.00)
ON DUPLICATE KEY UPDATE target_amount = VALUES(target_amount);

-- ── Income ('Ingresos', 61 rows) ─────────────────────────────────────────
INSERT INTO transactions
  (profile_id, account_id, type, amount, txn_date, concept, tag_id, is_fixed, source)
VALUES
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 445.98, '2026-01-05', 'Reembolso KLM', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Devolución'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 200.00, '2026-01-06', 'Regalo Reyes', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Regalos'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 11.90, '2026-01-13', 'Bizums bar castillo', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 21.59, '2026-01-23', 'Pantalon Bershka', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Devolución'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 898.87, '2026-01-28', 'Nómina Enero', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Nómina'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 185.62, '2026-01-30', 'Devolucion Booking', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Devolución'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 127.00, '2026-02-02', 'Regalo Mamá', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-02-05', 'Bizum Tita Jose', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 7.80, '2026-02-12', 'Bizum Glitch', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 3.84, '2026-02-12', 'Bizum Glitch', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 7.72, '2026-02-12', 'Bizum Glitch', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 936.85, '2026-02-25', 'Nómina Febrero', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Nómina'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 63.00, '2026-03-02', 'Regalo Ikea', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Regalos'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 200.00, '2026-03-03', 'Rooted', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Regalos'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 20.00, '2026-03-07', 'Mamá', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Regalos'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 50.00, '2026-03-13', 'Regalo Cumple', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Regalos'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 16.00, '2026-03-13', 'Cena Aron', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 4.00, '2026-03-14', 'Cubata Pablo', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 17.20, '2026-03-16', 'Bizum Pacheco', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 917.20, '2026-03-27', 'Nómina Marzo', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Nómina'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.50, '2026-03-22', 'Bizum Viki cena', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 6.01, '2026-03-21', 'Bizum Viki tricount', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 7.50, '2026-03-20', 'Bizum Elisa cine', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 7.50, '2026-03-20', 'Bizum Alejandra cine', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-04-27', 'Bizum paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 8.15, '2026-04-27', 'Bizum daniel fiesta', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 6.23, '2026-04-27', 'Bizum alejandra pizza', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 11.25, '2026-04-27', 'Bizum elisa pizza', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 917.20, '2026-04-28', 'Nómina Abril', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Nómina'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 14.45, '2026-05-07', 'Devolucion Bershka', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Devolución'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.00, '2026-05-07', 'Bizum camila', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 5.80, '2026-05-13', 'Bizum camila', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 437.00, '2026-05-13', 'Renta + Vet', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 917.20, '2026-05-27', 'Nómina Mayo', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Nómina'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 500.00, '2026-06-08', 'Ingreso Papá', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 114.33, '2026-06-18', 'Nómina Junio', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Nómina'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 780.42, '2026-06-18', 'Nómina Junio', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Nómina'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 159.00, '2026-06-21', 'Regalo tito jose', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Devolución'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 1199.40, '2026-06-26', 'Nómina Junio', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Nómina'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 12.00, '2026-07-02', 'Transporte', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 17.34, '2026-07-06', 'Devolucion womans', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Devolución'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 619.48, '2026-07-10', 'Finiquito', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Nómina'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'income', 50.00, '2026-07-09', 'Gasolina y pijama', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Bizum'), 0, 'manual');

-- ── Expenses ('Gastos', 113 rows) ────────────────────────────────────────
INSERT INTO transactions
  (profile_id, account_id, type, amount, txn_date, concept, tag_id, is_fixed, source)
VALUES
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 10.99, '2026-01-02', 'Good Notes', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Tecnología'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 55.37, '2026-01-11', 'Bershka', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Ropa'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 15.20, '2026-01-13', 'Bar castillo', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 16.80, '2026-01-16', 'Comida Empresa', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 22.96, '2026-01-20', 'Regalos Bershka', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 17.60, '2026-01-21', 'Cena ramen', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 2.80, '2026-01-25', 'Café', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 55.99, '2026-01-26', 'Laser', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Belleza'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 17.00, '2026-01-28', 'Toallita Ojos', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 56.00, '2026-01-28', 'Trenes Madrid', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Transporte'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 185.62, '2026-01-28', 'Equivocacion reserva', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 3.30, '2026-01-29', 'Almuerzo', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 126.65, '2026-01-29', 'Regalo Mamá', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Tecnología'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 29.00, '2026-01-30', 'Cena sushi', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 12.20, '2026-01-31', 'Cena cumple', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 129.06, '2026-02-12', 'Vuelos', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Transporte'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 170.00, '2026-02-12', 'Airbnb', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 149.99, '2026-02-15', 'Entrada Rooted', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Tecnología'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 8.30, '2026-02-16', 'San Valentin', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Honey'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 143.53, '2026-02-21', 'Hotel Madrid', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 39.40, '2026-02-19', 'Ave Madrid', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Transporte'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 14.25, '2026-02-22', 'Merienda', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 0.88, '2026-02-27', 'Twitter api', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Tecnología'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 11.99, '2026-03-06', 'Spotify', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Tecnología'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 62.79, '2026-03-02', 'Ikea', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 8.99, '2026-03-07', 'Regalo Elisa', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 15.00, '2026-03-07', 'Blind Box', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 42.00, '2026-03-07', 'Katsu Ramen', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 3.00, '2026-03-07', 'Iman', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 30.90, '2026-03-07', 'Transferencia Alejandra', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 4.00, '2026-03-07', 'Rooted', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Honey'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 36.00, '2026-03-07', 'Pop Mart', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Honey'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 45.00, '2026-03-07', 'Pop Mart', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 18.45, '2026-03-12', 'Bar Marvi', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 16.00, '2026-03-13', 'Cena todogigante', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 16.00, '2026-03-13', 'Cena todogigante', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 38.30, '2026-03-14', 'Mercadona fiesta', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 5.50, '2026-03-14', 'Cena Kebap', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 6.10, '2026-03-17', 'Churros', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 9.90, '2026-03-18', 'Mercadona', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 4.00, '2026-03-21', 'Regalo pañuelos', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 5.00, '2026-03-21', 'Metro', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Transporte'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 50.00, '2026-03-25', 'Maletas Ryanair', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 100.00, '2026-03-26', 'Pilates Abril', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 6.49, '2026-03-26', 'Spotify', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 46.90, '2026-03-29', 'Tomodachi', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 24.02, '2026-04-08', 'Mercadona', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 8.50, '2026-04-09', 'Cine', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 12.00, '2026-04-09', 'Palomitas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 10.00, '2026-04-08', 'Revolout', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 2.00, '2026-04-15', 'Bus', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Transporte'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 3.30, '2026-04-16', 'Almuerzo', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 29.77, '2026-04-17', 'Mercadona', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 5.40, '2026-04-17', 'Metro', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Transporte'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 10.00, '2026-04-17', 'Calimotxos', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 23.97, '2026-04-18', 'Womans Secret', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Ropa'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 12.80, '2026-04-18', 'Mercadona', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 12.00, '2026-04-19', 'Picca', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 3.50, '2026-04-21', 'Medico', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 1.95, '2026-04-21', 'Comida', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 8.50, '2026-04-23', 'Otros', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 33.71, '2026-04-24', 'Pipza', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 26.06, '2026-04-21', 'Bershka', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Ropa'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 6.49, '2026-04-26', 'Spotify', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 2.80, '2026-04-27', 'Cerveza fiesta', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 9.00, '2026-04-27', 'Ontinyent', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 160.00, '2026-04-28', 'Efectivo paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 24.17, '2026-04-29', 'Bershka', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Ropa'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 5.98, '2026-05-01', 'Dulces casa Elisa', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 2.40, '2026-05-08', 'Cena piso jordi', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 11.50, '2026-05-08', 'Paellas', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 6.00, '2026-05-08', 'Bono bebida', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 9.95, '2026-05-08', 'Otros', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 52.19, '2026-05-04', 'Laser', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Belleza'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 7.50, '2026-05-16', 'Copa', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 5.88, '2026-05-13', 'Medicina Peke', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 229.50, '2026-05-13', 'Vet Peke', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 5.80, '2026-05-19', 'Camila bizum', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 58.75, '2026-05-23', 'Hiper Asia', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Honey'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 21.78, '2026-05-23', 'Claude', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Tecnología'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 6.49, '2026-05-28', 'Spotify', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 42.08, '2026-05-28', 'Stradivarius', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Ropa'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 44.00, '2026-05-26', 'Nutricionista', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 27.28, '2026-06-08', 'Bershka', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Ropa'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 110.00, '2026-06-02', 'Entradas Blackworks', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 18.00, '2026-06-10', 'Bolera', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 6.00, '2026-06-11', 'CRUZ ROJA ESPAN', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 25.00, '2026-06-15', 'Nutricionista', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 16.90, '2026-06-15', 'Cine', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 14.50, '2026-06-16', 'FARMACIA JUAN L', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Belleza'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 159.00, '2026-06-17', 'Regalo tito jose', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 58.43, '2026-06-17', 'SheIn', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Ropa'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 9.20, '2026-06-19', 'LA BUENA VIDA', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 41.35, '2026-06-18', 'Capgemini VOG', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 14.95, '2026-06-22', 'Champions burger', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 13.00, '2026-06-23', 'San Juan', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 57.08, '2026-06-23', 'FARMACIA JUAN L', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 21.78, '2026-06-25', 'claude', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Tecnología'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 22.65, '2026-06-27', 'MERCADONA ALMAN', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 6.49, '2026-06-29', 'Spotify', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Tecnología'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 10.80, '2026-07-02', 'Otros', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 2.50, '2026-07-02', 'BLANC MARKT HOM', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Otros'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 18.00, '2026-07-02', 'Pilates', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Belleza'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 65.96, '2026-07-06', 'Oysho', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Ropa'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 85.00, '2026-07-07', 'RONA PILATES RE', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Belleza'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 12.99, '2026-07-09', 'JAKARTA MORAIRA', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Ropa'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 50.00, '2026-07-10', 'ES Z CANTOS SL', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Gasolina'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 6.00, '2026-07-03', 'Cerveza fiesta', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Entretenimiento'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 15.85, '2026-07-03', 'Consum', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Comida'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 2.00, '2026-07-03', 'Bus', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Transporte'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 59.73, '2026-07-02', 'Womans Secret', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Ropa'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 5.50, '2026-07-02', 'Rock', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Ropa'), 0, 'manual'),
  (3, (SELECT id FROM accounts WHERE profile_id = 3 AND name = 'Santander'), 'expense', 12.99, '2026-07-02', 'Bershka', (SELECT id FROM tags WHERE profile_id = 3 AND name = 'Ropa'), 0, 'manual');
