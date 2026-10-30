interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface EnvConfig {
  port: number;
  db: DbConfig;
  ingestToken: string;
  enableBanking: {
    appId: string;
    privateKeyPath: string;
    redirectUrl: string;
  };
}

export const env: EnvConfig = {
  port: Number(process.env.PORT || 4000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'finance',
    password: process.env.DB_PASSWORD || 'finance-pw',
    database: process.env.DB_NAME || 'finance',
  },
  ingestToken: process.env.INGEST_TOKEN || 'dev-ingest-token',
  enableBanking: {
    appId: process.env.ENABLE_BANKING_PEM_NAME || '',
    privateKeyPath: process.env.ENABLE_BANKING_PRIVATE_KEY_PATH || '/run/secrets/enable-banking.pem',
    redirectUrl: process.env.ENABLE_BANKING_REDIRECT_URL || 'https://banking.miquelgc.net/enablebanking/callback',
  },
};
