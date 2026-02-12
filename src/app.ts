import express from 'express';
import type { Request, Response } from 'express';
import { accountScope } from './middlewares/accountScope';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import webhookRoutes from './routes/webhook.routes';

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

  // Tenant bazlı tüm endpoint'ler için account scope middleware'i.
  // Health endpoint'i bu middleware'den önce tanımlandığı için accountId zorunluluğundan muaftır.
  app.use(accountScope);

  // Routes
  app.use('/webhooks', webhookRoutes);


  // Buraya ileride diğer router'lar eklenecek (webhooks, units, reservations vb.)

  // 404 ve global hata yakalayıcılar en sonda
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

