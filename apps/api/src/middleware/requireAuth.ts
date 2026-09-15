import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/apiError';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    next(ApiError.unauthorized());
    return;
  }
  next();
}
