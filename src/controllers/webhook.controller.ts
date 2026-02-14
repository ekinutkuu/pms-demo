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
            // 1. Zod Validation
            const validationResult = BookingWebhookSchema.safeParse(req.body);

            if (!validationResult.success) {
                // Map Zod errors to readable string
                const errorMessage = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                throw new ValidationError(errorMessage);
            }

            const payload = validationResult.data;
            const { unit_id } = payload.data;

            // 2. Resolve Account Context
            if (!mongoose.Types.ObjectId.isValid(unit_id)) {
                throw new ValidationError('Invalid unit ID format');
            }

            const Unit = mongoose.model('Unit');
            const unit = await Unit.findById(unit_id);

            if (!unit) {
                throw new ValidationError('Unit not found');
            }

            // 3. Security Check
            // Ensure payload account_id matches the unit's owner account_id
            if (payload.account_id !== unit.account_id.toString()) {
                throw new ValidationError('Account ID does not match the unit owner');
            }

            const accountId = unit.account_id;

            // 4. Process Webhook
            const result = await webhookService.processBookingWebhook(payload, accountId);

            if (result.status === 'CREATED') {
                res.status(201).json({
                    message: 'Booking processed successfully',
                    data: result.data
                });
            } else {
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
