-- ============================================================================
-- HoneyHold · MySQL 8 schema
-- Runs automatically on the first boot of the db container (empty volume).
-- ============================================================================

SET NAMES utf8mb4;

-- ── Profiles (data scopes, no auth) ─────────────────────────────────────────
CREATE TABLE profiles (
  id           TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(32)      NOT NULL,
  display_name VARCHAR(64)      NOT NULL,
  created_at   TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_profiles_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Accounts (owned by a profile) ───────────────────────────────────────────
CREATE TABLE accounts (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  profile_id      TINYINT UNSIGNED NOT NULL,
  name            VARCHAR(255)     NOT NULL,
  kind            ENUM('checking','savings','trading','investment','cash', 'company', 'other')      NOT NULL DEFAULT 'checking',
  initial_balance DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
  is_active       TINYINT(1)       NOT NULL DEFAULT 1,
  created_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_accounts_profile_name (profile_id, name),
  CONSTRAINT fk_accounts_profile FOREIGN KEY (profile_id)
    REFERENCES profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tags (profile_id NULL = global tag, visible to every profile) ───────────
CREATE TABLE tags (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  profile_id TINYINT UNSIGNED NULL,
  name       VARCHAR(255)     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_profile_name (profile_id, name),
  CONSTRAINT fk_tags_profile FOREIGN KEY (profile_id)
    REFERENCES profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Recurring rules (created by the "Is fixed?" toggle) ─────────────────────
-- A rule is a template; the materializer job inserts real transactions from it
-- whenever next_due <= today, then advances next_due by the frequency.
CREATE TABLE recurring_rules (
  id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  profile_id   TINYINT UNSIGNED NOT NULL,
  account_id   INT UNSIGNED     NOT NULL,
  type         ENUM('income','expense') NOT NULL,
  amount       DECIMAL(12,2)    NOT NULL,
  concept      VARCHAR(255)     NOT NULL,
  counterparty VARCHAR(255)     NULL,
  tag_id       INT UNSIGNED     NULL,
  frequency    ENUM('weekly','monthly','quarterly','yearly') NOT NULL,
  start_date   DATE             NOT NULL,
  end_date     DATE             NULL,
  next_due     DATE             NOT NULL,
  is_active    TINYINT(1)       NOT NULL DEFAULT 1,
  created_at   TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rules_due (is_active, next_due),
  CONSTRAINT fk_rules_profile FOREIGN KEY (profile_id)
    REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT fk_rules_account FOREIGN KEY (account_id)
    REFERENCES accounts (id) ON DELETE CASCADE,
  CONSTRAINT fk_rules_tag FOREIGN KEY (tag_id)
    REFERENCES tags (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Transactions (the ledger itself) ────────────────────────────────────────
-- profile_id is intentionally denormalized (derivable through accounts) so
-- that switching profiles is nothing but a WHERE profile_id = ? swap.
CREATE TABLE transactions (
  id                BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  profile_id        TINYINT UNSIGNED NOT NULL,
  account_id        INT UNSIGNED     NULL,
  type              ENUM('income','expense') NOT NULL,
  amount            DECIMAL(12,2)    NOT NULL,
  txn_date          DATE             NOT NULL,
  concept           VARCHAR(255)     NOT NULL,
  counterparty      VARCHAR(128)     NULL,
  tag_id            INT UNSIGNED     NULL,
  is_fixed          TINYINT(1)       NOT NULL DEFAULT 0,
  source            ENUM('manual','recurring','automated') NOT NULL DEFAULT 'manual',
  recurring_rule_id INT UNSIGNED     NULL,
  created_at        TIMESTAMP(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at        TIMESTAMP(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                     ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_txn_scope_date (profile_id, txn_date),
  KEY idx_txn_account (account_id),
  CONSTRAINT fk_txn_profile FOREIGN KEY (profile_id)
    REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT fk_txn_account FOREIGN KEY (account_id)
    REFERENCES accounts (id) ON DELETE CASCADE,
  CONSTRAINT fk_txn_tag FOREIGN KEY (tag_id)
    REFERENCES tags (id) ON DELETE SET NULL,
  CONSTRAINT fk_txn_rule FOREIGN KEY (recurring_rule_id)
    REFERENCES recurring_rules (id) ON DELETE SET NULL,
  CONSTRAINT chk_txn_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Transfers (money moved between owned accounts; not income/expense) ───────
CREATE TABLE transfers (
  id                 BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  creator_profile_id TINYINT UNSIGNED NOT NULL,
  from_account_id    INT UNSIGNED     NOT NULL,
  to_account_id      INT UNSIGNED     NOT NULL,
  amount             DECIMAL(12,2)    NOT NULL,
  txn_date           DATE             NOT NULL,
  concept            VARCHAR(255)     NOT NULL,
  tag_id             INT UNSIGNED     NULL,
  source             ENUM('manual','automated') NOT NULL DEFAULT 'manual',
  created_at         TIMESTAMP(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_transfer_date (txn_date),
  KEY idx_transfer_from (from_account_id),
  KEY idx_transfer_to (to_account_id),
  CONSTRAINT fk_transfer_creator FOREIGN KEY (creator_profile_id)
    REFERENCES profiles (id) ON DELETE RESTRICT,
  CONSTRAINT fk_transfer_from FOREIGN KEY (from_account_id)
    REFERENCES accounts (id) ON DELETE RESTRICT,
  CONSTRAINT fk_transfer_to FOREIGN KEY (to_account_id)
    REFERENCES accounts (id) ON DELETE RESTRICT,
  CONSTRAINT fk_transfer_tag FOREIGN KEY (tag_id)
    REFERENCES tags (id) ON DELETE SET NULL,
  CONSTRAINT chk_transfer CHECK (from_account_id <> to_account_id AND amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Inbox (staging area for automated ingestion) ────────────────────────────
-- Anything pushed through POST /api/ingest lands here, never directly in the
-- ledger. A human approves / edits / rejects each entry from the Inbox view.
-- (source, external_id) dedupes re-deliveries from the same provider.
CREATE TABLE inbox_entries (
  id             BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  source         VARCHAR(64)      NOT NULL,
  external_id    VARCHAR(128)     NULL,
  profile_id     TINYINT UNSIGNED NULL,
  account_id     INT UNSIGNED     NULL,
  suggested_type ENUM('income','expense') NULL,
  amount         DECIMAL(12,2)    NULL,
  txn_date       DATE             NULL,
  concept        VARCHAR(255)     NULL,
  counterparty   VARCHAR(128)     NULL,
  raw_payload    JSON             NULL,
  status         ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  transaction_id BIGINT UNSIGNED  NULL,
  created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at    TIMESTAMP        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inbox_dedupe (source, external_id),
  KEY idx_inbox_status (status, profile_id),
  CONSTRAINT fk_inbox_profile FOREIGN KEY (profile_id)
    REFERENCES profiles (id) ON DELETE SET NULL,
  CONSTRAINT fk_inbox_account FOREIGN KEY (account_id)
    REFERENCES accounts (id) ON DELETE SET NULL,
  CONSTRAINT fk_inbox_txn FOREIGN KEY (transaction_id)
    REFERENCES transactions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Goals (one monthly-savings and one annual target per profile per year) ──
CREATE TABLE goals (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  profile_id    TINYINT UNSIGNED NOT NULL,
  period        ENUM('monthly','annual') NOT NULL,
  year          SMALLINT UNSIGNED NOT NULL,
  target_amount DECIMAL(12,2)    NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_goals (profile_id, period, year),
  CONSTRAINT fk_goals_profile FOREIGN KEY (profile_id)
    REFERENCES profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
