import mongoose from 'mongoose';
import WebhookEvent from '../models/WebhookEvent.model';
import { reservationService } from './reservation.service';
import { logger } from '../utils/logger';
import { IReservation } from '../models/Reservation.model';
import { WebhookEventType, WebhookStatus, ReservationStatus, ListingSource } from '../constants';
import { BookingWebhookPayload } from '../schemas/webhook.schema';

export type WebhookResult =
    | { status: 'CREATED', data: IReservation }
    | { status: 'ALREADY_PROCESSED' };

export class WebhookService {
    /**
     * Processes a booking webhook event idempotently.
     * If the event ID has already been processed for this account, returns ALREADY_PROCESSED.
     * Otherwise, creates a reservation within the same transaction.
     */
    public async processBookingWebhook(
        payload: BookingWebhookPayload,
        account_id: mongoose.Types.ObjectId
    ): Promise<WebhookResult> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { event_id, type, data } = payload;

            // 1. Idempotency Check
            try {
                await WebhookEvent.create([{
                    account_id,
                    event_id,
                    event_type: type,
                    payload,
                    status: WebhookStatus.PROCESSED
                }], { session }); // Must use array for transaction support in create()
            } catch (error: any) {
                if (error.code === 11000) {
                    logger.info(`Duplicate webhook event ignored: ${event_id} for account ${account_id}`);
                    await session.abortTransaction();
                    return { status: 'ALREADY_PROCESSED' };
                }
                throw error;
            }

            // 2. Create Reservation
            // Map payload data to reservation model
            const reservationData = {
                account_id,
                unit_id: new mongoose.Types.ObjectId(data.unit_id),
                start_date: data.check_in,
                end_date: data.check_out,
                listing_source: data.source,
                reservation_id: data.reservation_id,
                status: ReservationStatus.CONFIRMED
            };

            const reservation = await reservationService.createReservation(reservationData, session);

            // 3. Commit
            await session.commitTransaction();
            logger.info(`Webhook processed successfully: ${event_id}`);

            return { status: 'CREATED', data: reservation };

        } catch (error) {
            // Abort transaction on any error (Conflict, Validation, etc.)
            await session.abortTransaction();
            logger.error('Webhook processing failed, transaction aborted', error);
            throw error;
        } finally {
            session.endSession();
        }
    }
}

export const webhookService = new WebhookService();
