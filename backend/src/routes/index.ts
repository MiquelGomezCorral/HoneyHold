import { Router } from 'express';
import profilesRouter from './profiles.routes.js';
import transactionsRouter from './transactions.routes.js';
import recurringRouter from './recurring.routes.js';
import inboxRouter from './inbox.routes.js';
import ingestRouter from './ingest.routes.js';
import transfersRouter from './transfers.routes.js';

const api = Router();

api.use('/profiles', profilesRouter);
api.use('/transactions', transactionsRouter);
api.use('/transfers', transfersRouter);
api.use('/recurring', recurringRouter);
api.use('/inbox', inboxRouter);
api.use('/ingest', ingestRouter);

export default api;
