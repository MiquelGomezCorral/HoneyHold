import { Router } from 'express';
import { asyncH, HttpError } from '../middleware/errors.js';
import * as txns from '../services/transactions.service.js';
import * as transfers from '../services/transfers.service.js';

const router = Router();

router.post('/', asyncH(async (req, res) =>
  res.status(201).json(await txns.createFromModal(req.body))));

router.put('/:id', asyncH(async (req, res) => {
  if (req.body.type === 'transfer') {
    const profileId = Number(req.body.profile_id);
    if (!Number.isInteger(profileId) || profileId <= 0) throw new HttpError(400, 'Invalid profile id');
    const created = await transfers.createFromModal(profileId, req.body);
    await txns.deleteTransaction(Number(req.params.id));
    return res.json(created);
  }

  res.json(await txns.updateFromModal(Number(req.params.id), req.body));
}));

router.delete('/:id', asyncH(async (req, res) => {
  await txns.deleteTransaction(Number(req.params.id));
  res.status(204).end();
}));

export default router;
