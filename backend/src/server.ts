import { app } from './app.js';
import { env } from './config/env.js';
import { scheduleMaterializer } from './jobs/materialize.js';
import { scheduleEnableBankingFetches } from './jobs/fetch-enable-banking.js';
import { initializeConnections } from './services/enable-banking.service.js';

let enableBankingReady = false;
try {
  await initializeConnections();
  enableBankingReady = true;
} catch (error) {
  console.warn('[enable-banking] initialization failed:', error instanceof Error ? error.message : error);
}

const server = app.listen(env.port, () => {
  console.log(`[api] listening on :${env.port}`);
  scheduleMaterializer();
  if (enableBankingReady) scheduleEnableBankingFetches();
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
