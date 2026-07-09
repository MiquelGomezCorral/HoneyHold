// Central place for every environment variable the API reads.
export const env = {
  port: Number(process.env.PORT || 4000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'finance',
    password: process.env.DB_PASSWORD || 'finance-pw',
    database: process.env.DB_NAME || 'finance',
  },
  ingestToken: process.env.INGEST_TOKEN || 'dev-ingest-token',
};
