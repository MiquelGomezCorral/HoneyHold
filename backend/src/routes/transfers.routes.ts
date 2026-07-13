import { Router } from 'express';
import { asyncH } from '../middleware/errors.js';
import * as transfers from '../services/transfers.service.js';
import * as txns from '../services/transactions.service.js';

const router = Router();

router.put('/:id', asyncH(async (req, res) => {
  if (req.body.type === 'transfer') {
    return res.json(await transfers.updateFromModal(Number(req.params.id), req.body));
  }

  const created = await txns.createFromModal(req.body);
  await transfers.deleteTransfer(Number(req.params.id));
  res.json(created);
}));

router.delete('/:id', asyncH(async (req, res) => {
  await transfers.deleteTransfer(Number(req.params.id));
  res.status(204).end();
}));

export default router;
