import { Router } from 'express';
import { asyncH } from '../middleware/errors.js';
import * as inbox from '../services/inbox.service.js';

const router = Router();

router.patch('/:id', asyncH(async (req, res) => {
  await inbox.updateEntry(Number(req.params.id), req.body);
  res.status(204).end();
}));

router.post('/:id/approve', asyncH(async (req, res) =>
  res.status(201).json(await inbox.approveEntry(Number(req.params.id), req.body || {}))));

router.post('/:id/reject', asyncH(async (req, res) => {
  await inbox.rejectEntry(Number(req.params.id));
  res.status(204).end();
}));

export default router;
