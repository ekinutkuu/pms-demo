import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import { validateWebhookSignature } from '../middlewares/validateSignature';

const router = Router();

router.use(validateWebhookSignature);

// POST /webhooks/bookings
router.post('/bookings', webhookController.handleBookingWebhook);

export default router;
