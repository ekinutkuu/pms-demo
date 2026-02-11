# About `WebhookEvent.model.ts`

Defines the `WebhookEvent` model, which serves as the **Idempotency Ledger** for the system.

## Schema: `WebhookEventSchema`

*   **Fields**:
    *   `account_id` (ObjectId, ref: 'Account', required): Tenant scope.
    *   `event_id` (String, required): Make/Provider ID for the event.
    *   `event_type` (String, required): Type of event (e.g., 'booking.created').
    *   `payload` (Object, required): The raw or processed payload.
    *   `processed_at` (Date, default: Date.now): Time of processing.
    *   `status` (String, enum: ['processed', 'failed'], default: 'processed'): Outcome.

## CRITICAL: Idempotency Mechanism

*   **Unique Index**: `{ account_id: 1, event_id: 1 }`
*   **Behavior**: This index **physically prevents** the database from accepting the same event ID twice for the same account.
*   **Flow**:
    1.  Start Transaction.
    2.  Try to insert `WebhookEvent`.
    3.  If it fails with `E11000` (Duplicate Key), abort and return `200 OK` (idempotent success).
    4.  If success, proceed with business logic.
