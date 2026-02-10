import type { NextFunction, Request, Response } from 'express';

// İleride domain bazlı özel hata sınıfları (ValidationError, ConflictError vb.) buraya map edilecek.
// Şimdilik genel bir HTTP hata dönüştürücü ile başlıyoruz.

// Basit extensible hata tipi
export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// 404 için middleware (route tanımlarından sonra kullanılacak)
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Kaynak bulunamadı',
    path: req.originalUrl,
  });
}

// Global hata yakalayıcı
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = 'Beklenmeyen bir hata oluştu';

  if (err instanceof HttpError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Geliştirme ortamında hata detayını logla (ileride proper logger ile değiştirilebilir)
  // eslint-disable-next-line no-console
  console.error(err);

  res.status(statusCode).json({
    success: false,
    message,
  });
}

