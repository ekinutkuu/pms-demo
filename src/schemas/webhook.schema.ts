import { z } from 'zod';
import { WebhookEventType, ListingSource } from '../constants';
import { dateOrDatetime } from '../utils/dateUtils';

export const BookingWebhookSchema = z.object({
    event_id: z.string().min(1, "Event ID is required"),
    type: z.nativeEnum(WebhookEventType),
    account_id: z.string().min(1, "Account ID is required"),
    data: z.object({
        reservation_id: z.string().min(1, "Reservation ID is required"),
        unit_id: z.string().min(1, "Unit ID is required"),
        check_in: dateOrDatetime('check_in'),
        check_out: dateOrDatetime('check_out'),
        source: z.nativeEnum(ListingSource).optional().default(ListingSource.DIRECT),
    }).strict().refine(
        data => data.check_out > data.check_in,
        { message: "check_out must be after check_in", path: ["check_out"] }
    ),
}).strict();

export type BookingWebhookPayload = z.infer<typeof BookingWebhookSchema>;
