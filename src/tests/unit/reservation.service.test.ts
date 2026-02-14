import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { reservationService } from '../../services/reservation.service';
import Reservation from '../../models/Reservation.model';
import Unit from '../../models/Unit.model';
import AvailabilityBlock from '../../models/AvailabilityBlock.model';
import { ReservationStatus } from '../../constants';

describe('Reservation Service - Conflict Detection', () => {
    let replSet: MongoMemoryReplSet;

    beforeAll(async () => {
        console.log("Setting up MongoMemoryReplSet...");
        replSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: 'wiredTiger' }
        });
        const uri = replSet.getUri();
        console.log("Connecting to Mongoose:", uri);
        await mongoose.connect(uri);
        console.log("Connected to Mongoose");
    });

    afterAll(async () => {
        console.log("Disconnecting Mongoose...");
        await mongoose.connection.close();
        await replSet.stop();
        console.log("Disconnected Mongoose");
    });

    afterEach(async () => {
        await Reservation.deleteMany({});
        await Unit.deleteMany({});
        await AvailabilityBlock.deleteMany({});
    });

    const accountId = new mongoose.Types.ObjectId();
    const unitId = new mongoose.Types.ObjectId();

    beforeEach(async () => {
        await Unit.create({
            _id: unitId,
            account_id: accountId,
            name: 'Test Unit',
        });
    });

    it('should create reservation if no conflicts exist', async () => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const reservation = await reservationService.createReservation({
                account_id: accountId,
                unit_id: unitId,
                start_date: new Date('2023-01-01T10:00:00Z'),
                end_date: new Date('2023-01-01T12:00:00Z'),
                listing_source: 'test'
            } as any, session);

            expect(reservation).toBeDefined();
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    });

    it('should throw conflict error if dates overlap (Exact Match)', async () => {
        await Reservation.create({
            account_id: accountId,
            unit_id: unitId,
            start_date: new Date('2023-01-01T10:00:00Z'),
            end_date: new Date('2023-01-01T12:00:00Z'),
            listing_source: 'test',
            status: ReservationStatus.CONFIRMED
        });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await expect(reservationService.createReservation({
                account_id: accountId,
                unit_id: unitId,
                start_date: new Date('2023-01-01T10:00:00Z'),
                end_date: new Date('2023-01-01T12:00:00Z'),
                listing_source: 'test'
            } as any, session)).rejects.toThrow('Dates are not available');
            await session.abortTransaction();
        } finally {
            session.endSession();
        }
    });

    it('should throw conflict error if dates overlap (Partial Start)', async () => {
        await Reservation.create({
            account_id: accountId,
            unit_id: unitId,
            start_date: new Date('2023-01-01T10:00:00Z'),
            end_date: new Date('2023-01-01T12:00:00Z'),
            listing_source: 'test',
            status: ReservationStatus.CONFIRMED
        });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await expect(reservationService.createReservation({
                account_id: accountId,
                unit_id: unitId,
                start_date: new Date('2023-01-01T11:00:00Z'),
                end_date: new Date('2023-01-01T13:00:00Z'),
                listing_source: 'test'
            } as any, session)).rejects.toThrow('Dates are not available');
            await session.abortTransaction();
        } finally {
            session.endSession();
        }
    });

    it('should throw conflict error if dates overlap (Partial End)', async () => {
        await Reservation.create({
            account_id: accountId,
            unit_id: unitId,
            start_date: new Date('2023-01-01T10:00:00Z'),
            end_date: new Date('2023-01-01T12:00:00Z'),
            listing_source: 'test',
            status: ReservationStatus.CONFIRMED
        });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await expect(reservationService.createReservation({
                account_id: accountId,
                unit_id: unitId,
                start_date: new Date('2023-01-01T09:00:00Z'),
                end_date: new Date('2023-01-01T11:00:00Z'),
                listing_source: 'test'
            } as any, session)).rejects.toThrow('Dates are not available');
            await session.abortTransaction();
        } finally {
            session.endSession();
        }
    });

    it('should throw conflict error if dates overlap (Engulfing)', async () => {
        await Reservation.create({
            account_id: accountId,
            unit_id: unitId,
            start_date: new Date('2023-01-01T10:00:00Z'),
            end_date: new Date('2023-01-01T12:00:00Z'),
            listing_source: 'test',
            status: ReservationStatus.CONFIRMED
        });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await expect(reservationService.createReservation({
                account_id: accountId,
                unit_id: unitId,
                start_date: new Date('2023-01-01T09:00:00Z'),
                end_date: new Date('2023-01-01T13:00:00Z'),
                listing_source: 'test'
            } as any, session)).rejects.toThrow('Dates are not available');
            await session.abortTransaction();
        } finally {
            session.endSession();
        }
    });

    it('should throw conflict error if dates overlap (Inside)', async () => {
        await Reservation.create({
            account_id: accountId,
            unit_id: unitId,
            start_date: new Date('2023-01-01T10:00:00Z'),
            end_date: new Date('2023-01-01T12:00:00Z'),
            listing_source: 'test',
            status: ReservationStatus.CONFIRMED
        });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await expect(reservationService.createReservation({
                account_id: accountId,
                unit_id: unitId,
                start_date: new Date('2023-01-01T10:30:00Z'),
                end_date: new Date('2023-01-01T11:30:00Z'),
                listing_source: 'test'
            } as any, session)).rejects.toThrow('Dates are not available');
            await session.abortTransaction();
        } finally {
            session.endSession();
        }
    });

    it('should NOT throw error if dates are adjacent (End=Start)', async () => {
        await Reservation.create({
            account_id: accountId,
            unit_id: unitId,
            start_date: new Date('2023-01-01T10:00:00Z'),
            end_date: new Date('2023-01-01T11:00:00Z'),
            listing_source: 'test',
            status: ReservationStatus.CONFIRMED
        });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const reservation = await reservationService.createReservation({
                account_id: accountId,
                unit_id: unitId,
                start_date: new Date('2023-01-01T11:00:00Z'),
                end_date: new Date('2023-01-01T12:00:00Z'),
                listing_source: 'test'
            } as any, session);
            expect(reservation).toBeDefined();
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    });

    it('should NOT throw error if dates are adjacent (Start=End)', async () => {
        await Reservation.create({
            account_id: accountId,
            unit_id: unitId,
            start_date: new Date('2023-01-01T11:00:00Z'),
            end_date: new Date('2023-01-01T12:00:00Z'),
            listing_source: 'test',
            status: ReservationStatus.CONFIRMED
        });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const reservation = await reservationService.createReservation({
                account_id: accountId,
                unit_id: unitId,
                start_date: new Date('2023-01-01T10:00:00Z'),
                end_date: new Date('2023-01-01T11:00:00Z'),
                listing_source: 'test'
            } as any, session);
            expect(reservation).toBeDefined();
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    });
});
