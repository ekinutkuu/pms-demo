import express from 'express';
import type { Request, Response } from 'express';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

export function createApp() {
  const app = express();

  app.use(express.json());

  // Basit health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Buraya ileride diğer router'lar eklenecek (webhooks, units, reservations vb.)

  // 404 ve global hata yakalayıcılar en sonda
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

