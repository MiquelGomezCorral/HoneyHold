import { Router } from 'express';
import { asyncH } from '../middleware/errors.js';
import * as transfers from '../services/transfers.service.js';

const router = Router();

router.delete('/:id', asyncH(async (req, res) => {
  await transfers.deleteTransfer(Number(req.params.id));
  res.status(204).end();
}));

export default router;
