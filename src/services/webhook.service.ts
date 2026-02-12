import mongoose from 'mongoose';
import WebhookEvent from '../models/WebhookEvent.model';
import { reservationService } from './reservation.service';
import { logger } from '../utils/logger';
import { IReservation } from '../models/Reservation.model';
import { WebhookEventType, WebhookStatus, ReservationStatus, ListingSource } from '../constants';

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
        payload: any,
        account_id: mongoose.Types.ObjectId
    ): Promise<WebhookResult> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { event_id, event_type, ...bookingData } = payload;

            // 1. Idempotency Check (Try to insert event)
            try {
                await WebhookEvent.create([{
                    account_id,
                    event_id,
                    event_type: event_type || WebhookEventType.BOOKING_CREATED,
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

            // 2. Create Reservation (Delegated to Domain Service)
            // Map payload to reservation model (assuming payload matches IReservation structure mostly)
            // In a real app, you'd have a DTO mapper here.
            const reservationData = {
                ...bookingData,
                account_id, // Ensure account_id is forced from context
                listing_source: bookingData.listing_source || ListingSource.DIRECT,
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
