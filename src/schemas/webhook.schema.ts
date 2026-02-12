import { z } from 'zod';
import { WebhookEventType } from '../constants';

export const BookingWebhookSchema = z.object({
    event_id: z.string().min(1, "Event ID is required"),
    event_type: z.string().default(WebhookEventType.BOOKING_CREATED),
    start_date: z.string().datetime({ message: "Invalid start_date format (ISO 8601 required)" }).transform(str => new Date(str)),
    end_date: z.string().datetime({ message: "Invalid end_date format (ISO 8601 required)" }).transform(str => new Date(str)),
    unit_id: z.string().min(1, "Unit ID is required"),
    listing_source: z.string().optional(),
    // Allow other fields to pass through (passthrough) or strip them (strict)
    // For webhooks, untyped extra fields might be common, so passthrough is safer unless we want strict validation.
}).passthrough();

export type BookingWebhookPayload = z.infer<typeof BookingWebhookSchema>;
