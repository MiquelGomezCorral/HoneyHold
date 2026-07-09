import { app } from './app.js';
import { env } from './config/env.js';
import { scheduleMaterializer } from './jobs/materialize.js';

const server = app.listen(env.port, () => {
  console.log(`[api] listening on :${env.port}`);
  scheduleMaterializer();
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
