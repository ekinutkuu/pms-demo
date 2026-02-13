import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { validateWebhookSignature } from '../../../middlewares/validateSignature';
import { env } from '../../../config/env';
import { BaseError, ForbiddenError, UnauthorizedError } from '../../../utils/errors';

// Mock env
jest.mock('../../../config/env', () => ({
    env: {
        webhookSecret: 'test-secret',
    },
}));

describe('validateWebhookSignature Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            headers: {},
            rawBody: Buffer.from(JSON.stringify({ test: 'data' })),
        };
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
    });

    const createSignature = (timestamp: number, body: Buffer) => {
        const payload = `${timestamp}.${body.toString()}`;
        return crypto
            .createHmac('sha256', 'test-secret')
            .update(payload)
            .digest('hex');
    };

    it('should call next() for valid signature and timestamp', () => {
        const now = Date.now();
        const signature = createSignature(now, req.rawBody!);

        req.headers = {
            'x-webhook-timestamp': now.toString(),
            'x-webhook-signature': signature,
        };

        validateWebhookSignature(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if headers are missing', () => {
        expect(() => {
            validateWebhookSignature(req as Request, res as Response, next);
        }).toThrow(UnauthorizedError);
    });

    it('should throw ForbiddenError if request is expired (replayed)', () => {
        const oldTimestamp = Date.now() - 6 * 60 * 1000; // 6 mins ago
        const signature = createSignature(oldTimestamp, req.rawBody!);

        req.headers = {
            'x-webhook-timestamp': oldTimestamp.toString(),
            'x-webhook-signature': signature,
        };

        expect(() => {
            validateWebhookSignature(req as Request, res as Response, next);
        }).toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError if request is from future (> 5 mins)', () => {
        const futureTimestamp = Date.now() + 6 * 60 * 1000; // +6 mins
        const signature = createSignature(futureTimestamp, req.rawBody!);

        req.headers = {
            'x-webhook-timestamp': futureTimestamp.toString(),
            'x-webhook-signature': signature,
        };

        expect(() => {
            validateWebhookSignature(req as Request, res as Response, next);
        }).toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError if signature is invalid', () => {
        const now = Date.now();
        req.headers = {
            'x-webhook-timestamp': now.toString(),
            'x-webhook-signature': 'invalid-signature',
        };

        expect(() => {
            validateWebhookSignature(req as Request, res as Response, next);
        }).toThrow(ForbiddenError);
    });

    it('should throw UnauthorizedError if timestamp is invalid', () => {
        req.headers = {
            'x-webhook-timestamp': 'invalid',
            'x-webhook-signature': 'some-sig'
        };

        expect(() => {
            validateWebhookSignature(req as Request, res as Response, next);
        }).toThrow(UnauthorizedError);
    });

    it('should throw BaseError(500) if rawBody is missing', () => {
        const now = Date.now();
        const signature = createSignature(now, Buffer.from(''));

        req.headers = {
            'x-webhook-timestamp': now.toString(),
            'x-webhook-signature': signature
        };
        delete req.rawBody;

        expect(() => {
            validateWebhookSignature(req as Request, res as Response, next);
        }).toThrow(BaseError);
    });
});
