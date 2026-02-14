import request from 'supertest';
import { createApp } from '../../app';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Reservation from '../../models/Reservation.model';
import AvailabilityBlock from '../../models/AvailabilityBlock.model';
import Unit from '../../models/Unit.model';

let app: ReturnType<typeof createApp>;
let mongoServer: MongoMemoryServer;

describe('Availability Query & Conflict API', () => {
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

    it('should fetch availability (reservations and blocks) via GET /units/:unitId/availability', async () => {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 5);

        // Create a Reservation
        const reservationStart = new Date(start);
        reservationStart.setDate(reservationStart.getDate() + 1);
        const reservationEnd = new Date(start);
        reservationEnd.setDate(reservationEnd.getDate() + 2);

        await Reservation.create({
            account_id: accountId,
            unit_id: unitId,
            start_date: reservationStart,
            end_date: reservationEnd,
            status: 'confirmed',
            listing_source: 'direct'
        });

        // Create an Availability Block
        const blockStart = new Date(start);
        blockStart.setDate(blockStart.getDate() + 3);
        const blockEnd = new Date(start);
        blockEnd.setDate(blockEnd.getDate() + 4);

        await AvailabilityBlock.create({
            account_id: accountId,
            unit_id: unitId,
            start_date: blockStart,
            end_date: blockEnd,
            source: 'maintenance'
        });

        const res = await request(app)
            .get(`/units/${unitId}/availability`)
            .set('x-account-id', accountId.toString())
            .query({
                start_date: start.toISOString(),
                end_date: end.toISOString()
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.reservations).toHaveLength(1);
        expect(res.body.data.availabilityBlocks).toHaveLength(1);
    });

    it('should return detailed error message on conflict with existing reservation', async () => {
        const start = new Date();
        start.setDate(start.getDate() + 1);
        const end = new Date();
        end.setDate(end.getDate() + 5);

        // Create existing reservation
        const resId = new mongoose.Types.ObjectId();
        await Reservation.create({
            _id: resId,
            account_id: accountId,
            unit_id: unitId,
            start_date: start,
            end_date: end,
            status: 'confirmed',
            listing_source: 'direct'
        });

        // Try to create overlapping block
        const res = await request(app)
            .post(`/units/${unitId}/availability/close`)
            .set('x-account-id', accountId.toString())
            .send({
                start_date: start.toISOString(),
                end_date: end.toISOString(),
                source: 'ownerBlocked'
            });

        expect(res.status).toBe(409);
        expect(res.body.message).toContain(`Time slot is already booked by reservation ${resId}`);
        expect(res.body.message).toContain(`Start: ${start.toISOString()}`);
    });

    it('should return detailed error message on conflict with existing block', async () => {
        const start = new Date();
        start.setDate(start.getDate() + 10);
        const end = new Date();
        end.setDate(end.getDate() + 15);

        // Create existing block
        const blockId = new mongoose.Types.ObjectId();
        await AvailabilityBlock.create({
            _id: blockId,
            account_id: accountId,
            unit_id: unitId,
            start_date: start,
            end_date: end,
            source: 'maintenance'
        });

        // Try to create overlapping block
        const res = await request(app)
            .post(`/units/${unitId}/availability/close`)
            .set('x-account-id', accountId.toString())
            .send({
                start_date: start.toISOString(),
                end_date: end.toISOString(),
                source: 'ownerBlocked'
            });

        expect(res.status).toBe(409);
        expect(res.body.message).toContain(`Time slot is already blocked by availability block ${blockId}`);
        expect(res.body.message).toContain(`Start: ${start.toISOString()}`);
    });
});
