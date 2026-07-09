import { Router } from 'express';
import { asyncH } from '../middleware/errors.js';
import * as txns from '../services/transactions.service.js';

const router = Router();

router.post('/', asyncH(async (req, res) =>
  res.status(201).json(await txns.createFromModal(req.body))));

router.delete('/:id', asyncH(async (req, res) => {
  await txns.deleteTransaction(Number(req.params.id));
  res.status(204).end();
}));

export default router;
