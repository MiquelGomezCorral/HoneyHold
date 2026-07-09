import { Router } from 'express';
import { asyncH } from '../middleware/errors.js';
import { ingestAuth } from '../middleware/ingestAuth.js';
import { ingestItems } from '../services/ingest.service.js';

const router = Router();

router.post('/', ingestAuth, asyncH(async (req, res) =>
  res.status(201).json(await ingestItems(req.body))));

export default router;
