import type { NextFunction, Request, Response } from 'express';

// TODO: Map domain-based custom error classes (ValidationError, ConflictError etc.) here in the future.
// Starting with a generic HTTP error converter for now.

// Simple extensible error type
export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Middleware for 404 (to be used after route definitions)
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    path: req.originalUrl,
  });
}

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = 'An unexpected error occurred';

  if (err instanceof HttpError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error && 'statusCode' in err) {
    // Handle BaseError and other custom errors with statusCode
    statusCode = (err as any).statusCode;
    message = err.message;
  }

  // Log error details in development environment (can be replaced with a proper logger later)
  // eslint-disable-next-line no-console
  console.error(err);

  res.status(statusCode).json({
    success: false,
    message,
  });
}

