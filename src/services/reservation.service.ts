import mongoose, { ClientSession } from 'mongoose';
import Reservation, { IReservation } from '../models/Reservation.model';
import Unit from '../models/Unit.model';
import AvailabilityBlock from '../models/AvailabilityBlock.model';
import { ConflictError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ReservationStatus } from '../constants';

export class ReservationService {
    /**
     * Creates a new reservation if no conflicts exist.
     * Must be called within a transaction session.
     */
    public async createReservation(
        data: Partial<IReservation>,
        session: ClientSession
    ): Promise<IReservation> {
        const { account_id, unit_id, start_date, end_date } = data;

        if (!account_id || !unit_id || !start_date || !end_date) {
            throw new Error('Missing required reservation fields');
        }

        // 0. Resource Locking (Prevent Double Booking)
        // Checks/Locks unit existence AND serializes requests for this unit
        // This MUST be done before conflict check to ensure strict serialization
        const unit = await Unit.findByIdAndUpdate(unit_id, {
            $set: { updatedAt: new Date() }
        }).session(session);

        if (!unit) {
            throw new Error('Unit not found');
        }

        // 1. Check for conflicts
        await this._checkConflicts(account_id, unit_id, start_date, end_date, session);

        // 2. Create reservation
        const [reservation] = await Reservation.create([data], { session });

        logger.info(`Reservation created: ${reservation._id}`);
        return reservation;
    }

    /**
     * Checks for overlapping reservations or availability blocks.
     * Rule: (Existing.start < New.end) && (Existing.end > New.start)
     */
    private async _checkConflicts(
        account_id: mongoose.Types.ObjectId,
        unit_id: mongoose.Types.ObjectId,
        start: Date,
        end: Date,
        session: ClientSession
    ): Promise<void> {
        const conflictQuery = {
            account_id,
            unit_id,
            start_date: { $lt: end },
            end_date: { $gt: start },
            status: { $ne: ReservationStatus.CANCELLED } // Ignore cancelled reservations
        };

        // Check existing reservations
        const existingReservation = await Reservation.findOne(conflictQuery).sort({ _id: 1 }).session(session);
        if (existingReservation) {
            throw new ConflictError(`Dates are not available (Reservation conflict: ${existingReservation._id})`);
        }

        // Check availability blocks
        // Note: AvailabilityBlock schema uses same field names and structure
        const existingBlock = await AvailabilityBlock.findOne({
            account_id,
            unit_id,
            start_date: { $lt: end },
            end_date: { $gt: start }
        }).sort({ _id: 1 }).session(session);

        if (existingBlock) {
            throw new ConflictError(`Dates are not available (Blocked: ${existingBlock._id})`);
        }
    }
}

export const reservationService = new ReservationService();
