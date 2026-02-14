import request from 'supertest';
import { createApp } from '../../app';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app: ReturnType<typeof createApp>;
let mongoServer: MongoMemoryServer;

describe('Availability Block API - Spec Alignment', () => {
    let accountId: mongoose.Types.ObjectId;
    let unitId: mongoose.Types.ObjectId;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        app = createApp();
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        accountId = new mongoose.Types.ObjectId();
        unitId = new mongoose.Types.ObjectId();

        const Unit = mongoose.model('Unit');
        await Unit.create({
            _id: unitId,
            account_id: accountId,
            name: 'Test Availability Unit',
        });
    });

    afterEach(async () => {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    it('should create an availability block via POST /units/:unitId/availability/close (201)', async () => {
        const futureStart = new Date();
        futureStart.setDate(futureStart.getDate() + 10);
        const futureEnd = new Date();
        futureEnd.setDate(futureEnd.getDate() + 15);

        const res = await request(app)
            .post(`/units/${unitId}/availability/close`)
            .set('x-account-id', accountId.toString())
            .send({
                start_date: futureStart.toISOString(),
                end_date: futureEnd.toISOString(),
                source: 'ownerBlocked',
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.source).toBe('ownerBlocked');
        expect(res.body.data.start_date).toBeDefined();
        expect(res.body.data.end_date).toBeDefined();
    });

    it('should return source field in response when provided', async () => {
        const futureStart = new Date();
        futureStart.setDate(futureStart.getDate() + 20);
        const futureEnd = new Date();
        futureEnd.setDate(futureEnd.getDate() + 25);

        const res = await request(app)
            .post(`/units/${unitId}/availability/close`)
            .set('x-account-id', accountId.toString())
            .send({
                start_date: futureStart.toISOString(),
                end_date: futureEnd.toISOString(),
                source: 'maintenance',
            });

        expect(res.status).toBe(201);
        expect(res.body.data.source).toBe('maintenance');
    });

    it('should create block without source field (optional)', async () => {
        const futureStart = new Date();
        futureStart.setDate(futureStart.getDate() + 30);
        const futureEnd = new Date();
        futureEnd.setDate(futureEnd.getDate() + 35);

        const res = await request(app)
            .post(`/units/${unitId}/availability/close`)
            .set('x-account-id', accountId.toString())
            .send({
                start_date: futureStart.toISOString(),
                end_date: futureEnd.toISOString(),
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.source).toBeUndefined();
    });

    it('should return 404 for old endpoint path /units/:unitId/availability', async () => {
        const futureStart = new Date();
        futureStart.setDate(futureStart.getDate() + 40);
        const futureEnd = new Date();
        futureEnd.setDate(futureEnd.getDate() + 45);

        const res = await request(app)
            .post(`/units/${unitId}/availability`)
            .set('x-account-id', accountId.toString())
            .send({
                start_date: futureStart.toISOString(),
                end_date: futureEnd.toISOString(),
                source: 'ownerBlocked',
            });

        expect(res.status).toBe(404);
    });

    it('should reject invalid source enum value', async () => {
        const futureStart = new Date();
        futureStart.setDate(futureStart.getDate() + 50);
        const futureEnd = new Date();
        futureEnd.setDate(futureEnd.getDate() + 55);

        const res = await request(app)
            .post(`/units/${unitId}/availability/close`)
            .set('x-account-id', accountId.toString())
            .send({
                start_date: futureStart.toISOString(),
                end_date: futureEnd.toISOString(),
                source: 'invalidValue',
            });

        expect(res.status).toBe(400);
    });
});
