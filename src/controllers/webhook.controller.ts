import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { webhookService } from '../services/webhook.service';
import { ValidationError } from '../utils/errors';

import { BookingWebhookSchema } from '../schemas/webhook.schema';

export class WebhookController {
    public async handleBookingWebhook(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // 1. Zod Validation (Extract unit_id from payload)
            const validationResult = BookingWebhookSchema.safeParse(req.body);

            if (!validationResult.success) {
                // Map Zod errors to readable string
                const errorMessage = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                throw new ValidationError(errorMessage);
            }

            const payload = validationResult.data;
            const { unit_id } = payload;

            // 2. Resolve Account Context (via Unit Lookup)
            // Since webhooks are public/unauthenticated (except signature), we trust the unit_id
            // to resolve the account context.
            if (!mongoose.Types.ObjectId.isValid(unit_id)) {
                throw new ValidationError('Invalid unit ID format');
            }

            const Unit = mongoose.model('Unit');
            const unit = await Unit.findById(unit_id);

            if (!unit) {
                throw new ValidationError('Unit not found');
            }

            const accountId = unit.account_id; // Implicitly trusted

            // 3. Process Webhook
            const result = await webhookService.processBookingWebhook(payload, accountId);

            if (result.status === 'CREATED') {
                res.status(201).json({
                    message: 'Booking processed successfully',
                    data: result.data
                });
            } else {
                // ALREADY_PROCESSED
                res.status(200).json({
                    message: 'Event already processed'
                });
            }
        } catch (error) {
            next(error);
        }
    }
}

export const webhookController = new WebhookController();
