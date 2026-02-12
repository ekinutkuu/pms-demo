# About `webhook.controller.ts`

Handles HTTP requests for webhook events.

## Functions

### `handleBookingWebhook(req, res, next)`

*   **Purpose**: Entry point for `POST /webhooks/bookings`.
*   **Behavior**:
    1.  **Account Context**: Extracts `accountId` from `req.context` (provided by `accountScope` middleware).
    2.  **Validation**:
        *   Checks if `accountId` exists and is a valid ObjectId.
        *   Performs basic payload validation (event_id, dates).
    3.  **Service Call**: Delegates logic to `WebhookService.processBookingWebhook`.
    4.  **Response**:
        *   `201 Created`: If a new reservation was created.
        *   `200 OK`: If the event was already processed (Idempotency).
    5.  **Error Handling**: Passes errors to the global error handler via `next()`.
