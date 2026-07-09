import { env } from '../config/env.js';
import { HttpError } from './errors.js';

// Shared-secret guard for the automation entry point (POST /api/ingest).
// Keeps the ingestion channel isolated from the (auth-less) household UI.
export function ingestAuth(req, res, next) {
  if (req.get('x-ingest-token') !== env.ingestToken) {
    return next(new HttpError(401, 'Invalid or missing x-ingest-token header'));
  }
  next();
}
