import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errorHandler';

/**
 * accountScope middleware'i, her istek için tenant kapsamını (accountId) üretir.
 *
 * NOT: Şu an için accountId doğrudan `x-account-id` header'ından okunmaktadır.
 * Gerçek bir üretim kurulumunda bu değer; JWT claim'i, webhook imza doğrulaması
 * veya provider → account mapping gibi daha güvenilir bir katmandan derive edilmelidir.
 * Header ham haliyle tek otorite olarak bırakılmamalıdır.
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

