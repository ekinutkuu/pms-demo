import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../../app';
import { env } from '../../config/env';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import '../../models/Unit.model'; // Register Unit model

// Mock env to ensure we have a known secret for testing
// We can't easily mock env module here because it's already imported in app
// But we can check if it matches what we expect or just use the one from env

const app = createApp();
const WEBHOOK_SECRET = env.webhookSecret || 'test-secret';
// Note: If env.webhookSecret is different in app runtime, tests will fail. 
// Ideally we should force it, but let's assume test env is set up correctly or use the one from imported config.

describe('Webhook Security Integration Tests', () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    // Helper to generate signature
    const generateSignature = (timestamp: number, body: string, secret: string = WEBHOOK_SECRET) => {
        const payload = `${timestamp}.${body}`;
        return crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    };

    const validPayload = {
        event_id: "evt_test_123",
        unit_id: new mongoose.Types.ObjectId().toString(), // valid mongo id
        guest: { name: "Test Guest" },
        start_date: "2024-01-01T12:00:00Z",
        end_date: "2024-01-05T12:00:00Z"
    };

    it('should return 400 (Unit not found) for Valid Signature and Timestamp', async () => {
        const timestamp = Date.now();
        const bodyInitial = JSON.stringify(validPayload);
        const signature = generateSignature(timestamp, bodyInitial);

        // We expect 400 because unit likely doesn't exist, but that means signature passed!
        // If signature failed, we'd get 403 or 401.
        const res = await request(app)
            .post('/webhooks/bookings')
            .set('x-webhook-timestamp', timestamp.toString())
            .set('x-webhook-signature', signature)
            .set('Content-Type', 'application/json')
            .send(bodyInitial); // supertest handles conversions but we need raw matching

        // NOTE: Supertest .send(object) might verify JSON content-type but ensuring rawBody matches
        // what we signed is critical.
        // Express `json()` middleware usually handles this if configured with verify.

        // If the app is using `app.use(express.json({ verify: ... }))` correctly, this should work.

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Unit not found|validation error/i);
    });

    it('should return 403 for Invalid Signature', async () => {
        const timestamp = Date.now();
        const body = JSON.stringify(validPayload);
        const signature = 'invalid-signature-hex-string';

        const res = await request(app)
            .post('/webhooks/bookings')
            .set('x-webhook-timestamp', timestamp.toString())
            .set('x-webhook-signature', signature)
            .send(validPayload);

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Invalid webhook signature/i);
    });

    it('should return 403 for Tampered Payload', async () => {
        const timestamp = Date.now();
        const originalBody = JSON.stringify(validPayload);
        const signature = generateSignature(timestamp, originalBody);

        // Tamper the payload
        const tamperedPayload = { ...validPayload, guest: { name: "Hacker" } };

        const res = await request(app)
            .post('/webhooks/bookings')
            .set('x-webhook-timestamp', timestamp.toString())
            .set('x-webhook-signature', signature) // Signature matches ORIGINAL body
            .send(tamperedPayload); // Sending TAMPERED body

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Invalid webhook signature/i);
    });

    it('should return 403 for Replay Attack (Old Timestamp)', async () => {
        const oldTimestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
        const body = JSON.stringify(validPayload);
        const signature = generateSignature(oldTimestamp, body);

        const res = await request(app)
            .post('/webhooks/bookings')
            .set('x-webhook-timestamp', oldTimestamp.toString())
            .set('x-webhook-signature', signature)
            .send(validPayload);

        expect(res.status).toBe(403); // ForbiddenError vs UnauthorizedError depending on impl
        expect(res.body.message).toMatch(/expired|replay/i);
    });

    it('should return 401 for Missing Headers', async () => {
        const res = await request(app)
            .post('/webhooks/bookings')
            .send(validPayload);

        expect(res.status).toBe(401);
        // expect(res.body.error).toMatch(/Missing webhook signature/i);
    });

    it('should return 403 for Future Timestamp (Clock Skew Protection)', async () => {
        const futureTimestamp = Date.now() + (10 * 60 * 1000); // 10 minutes in future
        const body = JSON.stringify(validPayload);
        const signature = generateSignature(futureTimestamp, body);

        const res = await request(app)
            .post('/webhooks/bookings')
            .set('x-webhook-timestamp', futureTimestamp.toString())
            .set('x-webhook-signature', signature)
            .send(validPayload);

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/future/i);
    });

    it('should handle Unicode characters in body', async () => {
        const unicodePayload = { ...validPayload, guest: { name: "Guest 🚀 İğüşöç" } };
        const timestamp = Date.now();
        const bodyString = JSON.stringify(unicodePayload);
        const signature = generateSignature(timestamp, bodyString);

        const res = await request(app)
            .post('/webhooks/bookings')
            .set('x-webhook-timestamp', timestamp.toString())
            .set('x-webhook-signature', signature)
            .set('Content-Type', 'application/json')
            .send(bodyString);

        expect(res.status).toBe(400); // Should pass signature check
    });
});
