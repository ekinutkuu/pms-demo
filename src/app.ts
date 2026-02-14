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

  // Health Check Endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Webhook Routes (No Auth/AccountScope required as they have their own signature verification)
  app.use('/webhooks', webhookRoutes);

  // Account scope middleware for all tenant-based endpoints.
  app.use(accountScope);

  // Routes
  app.use('/units', unitRoutes);

  // 404 and global error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

