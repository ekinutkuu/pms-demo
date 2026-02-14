import mongoose from 'mongoose';
import AvailabilityBlock, { IAvailabilityBlock } from '../models/AvailabilityBlock.model';
import Reservation from '../models/Reservation.model';
import Unit from '../models/Unit.model';
import { NotFoundError, ConflictError } from '../utils/errors';
import { getOverlapQuery } from '../utils/dateUtils';
import { CreateAvailabilityBlockInput, GetAvailabilityInput } from '../schemas/availability.schema';

export const createBlock = async (
    accountId: string,
    unitId: string,
    data: CreateAvailabilityBlockInput['body']
): Promise<IAvailabilityBlock> => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // 1. Verify Unit Ownership
        const unit = await Unit.findOne({ _id: unitId, account_id: accountId }).session(session);
        if (!unit) {
            throw new NotFoundError('Unit not found or does not belong to this account');
        }

        const { start_date, end_date, source } = data;

        // 2 & 3. Check for conflicts
        await _checkConflicts(unitId, accountId, start_date, end_date, undefined, session);

        // 4. Create the Block
        const [block] = await AvailabilityBlock.create([{
            account_id: accountId,
            unit_id: unitId,
            start_date,
            end_date,
            source
        }], { session });

        await session.commitTransaction();
        return block;
    } catch (error: any) {
        await session.abortTransaction();

        // Fallback for standalone MongoDB (no transactions)
        if (error.message && error.message.includes('Transaction numbers are only allowed on a replica set')) {
            // Retry without session
            // 1. Verify Unit Ownership
            const unit = await Unit.findOne({ _id: unitId, account_id: accountId });
            if (!unit) {
                throw new NotFoundError('Unit not found or does not belong to this account');
            }

            const { start_date, end_date, source } = data;

            // 2 & 3. Check for conflicts
            await _checkConflicts(unitId, accountId, start_date, end_date);

            // 4. Create the Block
            const block = await AvailabilityBlock.create({
                account_id: accountId,
                unit_id: unitId,
                start_date,
                end_date,
                source
            });
            return block;
        }

        throw error;
    } finally {
        session.endSession();
    }
};

export const getAvailability = async (
    accountId: string,
    unitId: string,
    query: GetAvailabilityInput['query']
) => {
    // 1. Verify Unit Ownership
    const unit = await Unit.findOne({ _id: unitId, account_id: accountId });
    if (!unit) {
        throw new NotFoundError('Unit not found or does not belong to this account');
    }

    const { start_date, end_date } = query;
    const overlapQuery = getOverlapQuery(start_date, end_date);

    // 2. Fetch Reservations
    const reservations = await Reservation.find({
        unit_id: unitId,
        account_id: accountId,
        status: { $ne: 'CANCELLED' },
        ...overlapQuery
    });

    // 3. Fetch Availability Blocks
    const availabilityBlocks = await AvailabilityBlock.find({
        unit_id: unitId,
        account_id: accountId,
        deletedAt: { $exists: false },
        ...overlapQuery
    });

    return {
        reservations,
        availabilityBlocks
    };
};

const _checkConflicts = async (
    unitId: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
    excludeReservationId?: string,
    session?: mongoose.ClientSession
): Promise<void> => {
    const overlapQuery = getOverlapQuery(startDate, endDate);

    // Check for conflicts with existing Reservations
    const conflictingReservation = await Reservation.findOne({
        unit_id: unitId,
        account_id: accountId,
        status: { $ne: 'CANCELLED' },
        ...(excludeReservationId ? { _id: { $ne: excludeReservationId } } : {}),
        ...overlapQuery
    }).session(session || null);

    if (conflictingReservation) {
        throw new ConflictError(
            `Time slot is already booked by reservation ${conflictingReservation._id} ` +
            `(Start: ${conflictingReservation.start_date.toISOString()}, End: ${conflictingReservation.end_date.toISOString()})`
        );
    }

    // Check for conflicts with existing Availability Blocks
    const conflictingBlock = await AvailabilityBlock.findOne({
        unit_id: unitId,
        account_id: accountId,
        deletedAt: { $exists: false },
        ...overlapQuery
    }).session(session || null);

    if (conflictingBlock) {
        throw new ConflictError(
            `Time slot is already blocked by availability block ${conflictingBlock._id} ` +
            `(Start: ${conflictingBlock.start_date.toISOString()}, End: ${conflictingBlock.end_date.toISOString()})`
        );
    }
};
