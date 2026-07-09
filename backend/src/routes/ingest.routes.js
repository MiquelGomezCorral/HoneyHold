import { Router } from 'express';
import { asyncH } from '../middleware/errors.js';
import { ingestAuth } from '../middleware/ingestAuth.js';
import { ingestItems } from '../services/ingest.service.js';

const router = Router();

// Automation entry point. Anything POSTed here lands in the inbox for human
// triage — never directly in the ledger. Guarded by x-ingest-token.
router.post('/', ingestAuth, asyncH(async (req, res) =>
  res.status(201).json(await ingestItems(req.body))));

export default router;
