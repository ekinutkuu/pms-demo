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
            const accountIdStr = req.context?.accountId;
            if (!accountIdStr) {
                throw new ValidationError('Account context is missing');
            }

            if (!mongoose.Types.ObjectId.isValid(accountIdStr)) {
                throw new ValidationError('Invalid account ID format');
            }

            const accountId = new mongoose.Types.ObjectId(accountIdStr);

            // Validate payload with Zod
            const validationResult = BookingWebhookSchema.safeParse(req.body);

            if (!validationResult.success) {
                // Map Zod errors to readable string
                const errorMessage = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                throw new ValidationError(errorMessage);
            }

            const payload = validationResult.data;

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
