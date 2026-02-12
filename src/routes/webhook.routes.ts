import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';

const router = Router();

// POST /webhooks/bookings
router.post('/bookings', webhookController.handleBookingWebhook);

export default router;
