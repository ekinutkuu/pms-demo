# About `webhook.service.ts`

Orchestrates the processing of incoming webhooks with a focus on **Idempotency**.

## Functions

### `processBookingWebhook(payload, account_id)`

*   **Purpose**: Handles the "booking created" event flow with nested payload mapping.
*   **Input**: `BookingWebhookPayload` (Zod validated) + `account_id` (ObjectId)
*   **Data Mapping** (yeni payload → iç model):
    *   `payload.type` → `WebhookEvent.event_type`
    *   `payload.data.check_in` → `Reservation.start_date`
    *   `payload.data.check_out` → `Reservation.end_date`
    *   `payload.data.source` → `Reservation.listing_source`
    *   `payload.data.unit_id` → `Reservation.unit_id` (ObjectId'ye dönüştürülür)
*   **Flow**:
    1.  **Start Transaction**: Opens a new MongoDB transaction.
    2.  **Idempotency Guard**:
        *   Tries to insert a `WebhookEvent` with the given `event_id`.
        *   **If Duplicate**: Catches `E11000` error, aborts transaction, and returns `{ status: 'ALREADY_PROCESSED' }`.
        *   **If New**: Continues.
    3.  **Process Business Logic**: Mapped data ile `ReservationService.createReservation()` çağrılır.
    4.  **Commit**: If all successful, commits the transaction.
*   **Error Handling**: Aborts transaction on any error (Conflict, Validation, etc.) and re-throws for the controller to handle.
