import express from 'express';
import type { Request, Response } from 'express';
import { accountScope } from './middlewares/accountScope';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import webhookRoutes from './routes/webhook.routes';
import unitRoutes from './routes/unit.routes';

export function createApp() {
  const app = express();

  app.use(express.json({
    limit: '1mb',
    verify: (req: Request, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Basit health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Webhook rotaları (Auth/AccountScope gerektirmez çünkü kendi imza kontrolleri var)
  app.use('/webhooks', webhookRoutes);

  // Tenant bazlı tüm endpoint'ler için account scope middleware'i.
  // Health ve Webhook endpoint'leri bu middleware'den önce tanımlandığı için muaftır.
  app.use(accountScope);

  // Routes
  app.use('/units', unitRoutes);


  // Buraya ileride diğer router'lar eklenecek (webhooks, units, reservations vb.)

  // 404 ve global hata yakalayıcılar en sonda
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

