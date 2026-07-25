import { app } from './app.js';
import { env } from './config/env.js';
import { scheduleMaterializer } from './jobs/materialize.js';
import { ensureProtectedTags } from './services/tags.service.js';

const server = app.listen(env.port, () => {
  console.log(`[api] listening on :${env.port}`);
  ensureProtectedTags()
    .catch((err) => console.error('[api] protected tag sync failed', err))
    .finally(() => scheduleMaterializer());
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
