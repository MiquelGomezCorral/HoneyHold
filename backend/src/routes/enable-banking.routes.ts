import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncH, HttpError } from '../middleware/errors.js';
import { ingestAuth } from '../middleware/ingestAuth.js';
import * as enableBanking from '../services/enable-banking.service.js';
import { env } from '../config/env.js';

const router = Router();

router.use(ingestAuth);
router.use((_req, _res, next) => {
  if (env.ingestToken === 'dev-ingest-token') {
    return next(new HttpError(503, 'Set a non-default INGEST_TOKEN before managing bank connections'));
  }
  next();
});

router.get('/connections', asyncH(async (_req, res) => {
  res.json(await enableBanking.listConnections());
}));

router.post('/connections/:id/authorize', asyncH(async (req, res) => {
  const connectionId = Number(req.params.id);
  if (!Number.isInteger(connectionId)) throw new HttpError(400, 'Invalid connection id');
  res.json(await enableBanking.startAuthorization(connectionId));
}));

export async function enableBankingCallback(req: Request, res: Response) {
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const error = typeof req.query.error === 'string' ? req.query.error : '';
  if (!state) throw new HttpError(400, 'Missing state');
  if (error) {
    await enableBanking.failAuthorization(state, error);
    throw new HttpError(400, 'Bank authorization failed');
  }
  if (!code) throw new HttpError(400, 'Missing code');

  await enableBanking.completeAuthorization(state, code);
  res.type('text').send('Bank connected. You may close this page.');
}

export default router;
