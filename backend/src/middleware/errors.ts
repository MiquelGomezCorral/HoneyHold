import type { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const asyncH = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const status = (err as HttpError).status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Internal error' });
}
