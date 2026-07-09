import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { HttpError } from './errors.js';

export function ingestAuth(req: Request, _res: Response, next: NextFunction) {
  if (req.get('x-ingest-token') !== env.ingestToken) {
    return next(new HttpError(401, 'Invalid or missing x-ingest-token header'));
  }
  next();
}
