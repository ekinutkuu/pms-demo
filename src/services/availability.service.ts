import mongoose from 'mongoose';
import AvailabilityBlock, { IAvailabilityBlock } from '../models/AvailabilityBlock.model';
import Reservation from '../models/Reservation.model';
import Unit from '../models/Unit.model';
import { NotFoundError, ConflictError } from '../utils/errors';
import { CreateAvailabilityBlockInput } from '../schemas/availability.schema';
import { getOverlapQuery } from '../utils/dateUtils';

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

        const { start_date, end_date, reason } = data;
        const overlapQuery = getOverlapQuery(start_date, end_date);

        // 2. Check for conflicts with existing Reservations
        const conflictingReservation = await Reservation.findOne({
            unit_id: unitId,
            account_id: accountId,
            status: { $ne: 'CANCELLED' },
            ...overlapQuery
        }).session(session);

        if (conflictingReservation) {
            throw new ConflictError(`Time slot is already booked by reservation ${conflictingReservation._id}`);
        }

        // 3. Check for conflicts with existing Availability Blocks
        const conflictingBlock = await AvailabilityBlock.findOne({
            unit_id: unitId,
            account_id: accountId,
            ...overlapQuery
        }).session(session);

        if (conflictingBlock) {
            throw new ConflictError(`Time slot is already blocked by availability block ${conflictingBlock._id}`);
        }

        // 4. Create the Block
        const [block] = await AvailabilityBlock.create([{
            account_id: accountId,
            unit_id: unitId,
            start_date,
            end_date,
            reason
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

            const { start_date, end_date, reason } = data;
            const overlapQuery = getOverlapQuery(start_date, end_date);

            // 2. Check for conflicts with existing Reservations
            const conflictingReservation = await Reservation.findOne({
                unit_id: unitId,
                account_id: accountId,
                status: { $ne: 'CANCELLED' },
                ...overlapQuery
            });

            if (conflictingReservation) {
                throw new ConflictError(`Time slot is already booked by reservation ${conflictingReservation._id}`);
            }

            // 3. Check for conflicts with existing Availability Blocks
            const conflictingBlock = await AvailabilityBlock.findOne({
                unit_id: unitId,
                account_id: accountId,
                ...overlapQuery
            });

            if (conflictingBlock) {
                throw new ConflictError(`Time slot is already blocked by availability block ${conflictingBlock._id}`);
            }

            // 4. Create the Block
            const block = await AvailabilityBlock.create({
                account_id: accountId,
                unit_id: unitId,
                start_date,
                end_date,
                reason
            });
            return block;
        }

        throw error;
    } finally {
        session.endSession();
    }
};
