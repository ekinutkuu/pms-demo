import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errorHandler';

/**
 * accountScope middleware extracts the tenant scope (accountId) for each request.
 *
 * NOTE: Currently, accountId is read directly from the `x-account-id` header.
 * In a real production setup, this value should be derived from a more reliable source
 * like a JWT claim, webhook signature verification, or provider -> account mapping.
 * The header should not be the sole authority in its raw form.
 */
export function accountScope(req: Request, _res: Response, next: NextFunction): void {
  const rawAccountId = req.header('x-account-id');
  const accountId = rawAccountId?.trim();

  if (!accountId) {
    throw new HttpError(401, 'Account scope (account_id) gerekli');
  }

  req.context = {
    ...(req.context ?? {}),
    accountId,
  };

  next();
}

