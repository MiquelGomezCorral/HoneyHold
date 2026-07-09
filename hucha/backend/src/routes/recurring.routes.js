import { Router } from 'express';
import { asyncH, HttpError } from '../middleware/errors.js';
import * as recurring from '../services/recurring.service.js';

const router = Router();

// "Stop" a fixed rule: future occurrences end, past ledger rows stay.
router.delete('/:id', asyncH(async (req, res) => {
  const ok = await recurring.deactivateRule(Number(req.params.id));
  if (!ok) throw new HttpError(404, 'Rule not found');
  res.status(204).end();
}));

export default router;
