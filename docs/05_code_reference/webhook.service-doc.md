# About `webhook.service.ts`

Orchestrates the processing of incoming webhooks with a focus on **Idempotency**.

## Functions

### `processBookingWebhook(payload, account_id)`

*   **Purpose**: Handles the "booking created" event flow.
*   **Flow**:
    1.  **Start Transaction**: Opens a new MongoDB transaction.
    2.  **Idempotency Guard**:
        *   Tries to insert a `WebhookEvent` with the given `event_id`.
        *   **If Duplicate**: Catches `E11000` error, aborts transaction, and returns `{ status: 'ALREADY_PROCESSED' }`.
        *   **If New**: Continues.
    3.  **Process Business Logic**: Call `ReservationService.createReservation()`.
    4.  **Commit**: If all successful, commits the transaction.
*   **Error Handling**: Aborts transaction on any error (Conflict, Validation, etc.) and re-throws for the controller to handle.
