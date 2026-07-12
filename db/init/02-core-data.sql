-- ============================================================================

SET NAMES utf8mb4;
-- HoneyHold · core data (required)
-- The three profiles and their accounts, global tags, starter goals.
-- ============================================================================
INSERT INTO profiles (id, slug, display_name) VALUES
  (1, 'shared',  'Shared'),
  (2, 'honey-1', 'Honey 1'),
  (3, 'honey-2', 'Honey 2');


-- Global tags (profile_id NULL → visible to every profile)
INSERT INTO tags (profile_id, name) VALUES
  (NULL, 'Alquiler'),
  (NULL, 'Salud'),
  (NULL, 'Inversión'),
  (NULL, 'Bizum'),
  (NULL, 'Comida'),
  (NULL, 'Entretenimiento'),
  (NULL, 'Honey'),
  (NULL, 'Nómina'),
  (NULL, 'Devolución'),
  (NULL, 'Regalos'),
  (NULL, 'Ropa'),
  (NULL, 'Gente'),
  (NULL, 'Tecnología'),
  (NULL, 'Transporte'),
  (NULL, 'Belleza'),
  (NULL, 'Clase'),
  (NULL, 'Otros');

-- Starter goals for the current year (editable from the dashboard)
INSERT INTO goals (profile_id, period, year, target_amount) VALUES
  (1, 'monthly', YEAR(CURDATE()),  0.00),
  (1, 'annual',  YEAR(CURDATE()), 0.00),
  (2, 'monthly', YEAR(CURDATE()),  1100.00),
  (2, 'annual',  YEAR(CURDATE()), 6600.00),
  (3, 'monthly', YEAR(CURDATE()),  800.00),
  (3, 'annual',  YEAR(CURDATE()),  4200.00);
