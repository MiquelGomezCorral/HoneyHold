CREATE TABLE IF NOT EXISTS enable_banking_connections (
  id                       INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  profile_id               TINYINT UNSIGNED NOT NULL,
  account_id               INT UNSIGNED     NOT NULL,
  aspsp_name               VARCHAR(128)     NOT NULL,
  aspsp_country            CHAR(2)          NOT NULL,
  session_id               CHAR(36)         NULL,
  account_uid              CHAR(36)         NULL,
  account_fingerprint      CHAR(64)         NULL,
  consent_valid_until      DATETIME(6)      NULL,
  pending_state_hash       CHAR(64)         NULL,
  pending_state_expires_at DATETIME(6)      NULL,
  status                   ENUM('unauthorized','pending','authorized','expired','error')
                                            NOT NULL DEFAULT 'unauthorized',
  last_fetch_attempt_at    DATETIME(6)      NULL,
  last_successful_fetch_at DATETIME(6)      NULL,
  last_completed_slot_at   DATETIME(6)      NULL,
  last_error               VARCHAR(512)     NULL,
  created_at               TIMESTAMP(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at               TIMESTAMP(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                            ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_eb_connection (aspsp_name, aspsp_country, profile_id, account_id),
  UNIQUE KEY uq_eb_pending_state (pending_state_hash),
  KEY idx_eb_status_expiry (status, consent_valid_until),
  CONSTRAINT fk_eb_profile FOREIGN KEY (profile_id)
    REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT fk_eb_account FOREIGN KEY (account_id)
    REFERENCES accounts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
