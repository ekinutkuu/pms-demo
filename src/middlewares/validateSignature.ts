import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { BaseError, ForbiddenError, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export const validateWebhookSignature = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    if (!signature || !timestamp) {
        throw new UnauthorizedError('Missing webhook signature or timestamp');
    }

    // 1. Replay Attack Protection (5 minutes tolerance)
    const now = Date.now();
    const timestampMs = Number(timestamp); // Assuming ms, if seconds * 1000

    if (isNaN(timestampMs)) {
        logger.warn(`Security: Invalid timestamp format from IP ${req.ip}`);
        throw new UnauthorizedError('Invalid timestamp format');
    }

    const fiveMinutes = 5 * 60 * 1000;

    // Check for expired requests (past)
    if (now - timestampMs > fiveMinutes) {
        logger.warn(`Security: Expired webhook request from IP ${req.ip}. Diff: ${now - timestampMs}ms`);
        throw new ForbiddenError('Webhook request expired');
    }

    // Check for future requests (future tolerance)
    if (timestampMs - now > fiveMinutes) {
        logger.warn(`Security: Future webhook request from IP ${req.ip}. Diff: ${timestampMs - now}ms`);
        throw new ForbiddenError('Webhook request from the future rejected');
    }

    if (!req.rawBody) {
        logger.error(`Security: Webhook body missing raw content from IP ${req.ip}`);
        throw new BaseError('Webhook body missing or not parsed as raw', 500);
    }

    // 2. Signature Validation
    const payload = `${timestamp}.${req.rawBody.toString()}`;
    const hmac = crypto.createHmac('sha256', env.webhookSecret);
    const calculatedSignature = hmac.update(payload).digest('hex');

    const providedSignature = Array.isArray(signature) ? signature[0] : signature;
    const sigBuffer = Buffer.from(providedSignature);
    const calcBuffer = Buffer.from(calculatedSignature);

    if (sigBuffer.length !== calcBuffer.length || !crypto.timingSafeEqual(sigBuffer, calcBuffer)) {
        logger.warn(`Security: Invalid webhook signature from IP ${req.ip}`);
        throw new ForbiddenError('Invalid webhook signature');
    }

    next();
};
