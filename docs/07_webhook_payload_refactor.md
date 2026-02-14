# Webhook Payload Refactor - Analysis & Requirements

## 1. Overview
The `POST /webhooks/bookings` endpoint payload structure needs to be updated. The current flat structure is being replaced by a nested structure with standard field names (e.g., `check_in` instead of `start_date`).

This document provides the necessary specifications for the **Backend Agent** to implement these changes.

## 2. New Payload Structure
The system must accept and validate the following JSON payload:

```json
{
  "event_id": "evt_001",
  "type": "booking_created",
  "account_id": "acc_123",
  "data": {
    "reservation_id": "res_001",
    "unit_id": "unit_10",
    "check_in": "2026-08-10",
    "check_out": "2026-08-15",
    "source": "airbnb"
  }
}
```

### Field Mapping
| New Field | Old Field (Internal Model) | Description |
| :--- | :--- | :--- |
| `event_id` | `event_id` | Unique event identifier (for idempotency) |
| `type` | `event_type` | Event type (e.g., `booking_created`) |
| `account_id` | `account_id` | Account identifier (must verify matching Unit's account) |
| `data.reservation_id` | N/A | External reservation ID (store or log if needed) |
| `data.unit_id` | `unit_id` | Target Unit ID |
| `data.check_in` | `start_date` | Reservation start date (ISO8601 Date/DateTime) |
| `data.check_out` | `end_date` | Reservation end date (ISO8601 Date/DateTime) |
| `data.source` | `listing_source` | Source of booking (e.g., airbnb, booking.com) |

## 3. Required Changes

### 3.1. Schema Update (`src/schemas/webhook.schema.ts`)
The Zod schema `BookingWebhookSchema` must be completely rewritten to match the new nested structure.

**Requirements:**
- Update `event_type` (if exists) -> `type`.
- Add `account_id` field (string, required).
- Create a `data` object schema containing:
    - `reservation_id` (string, required).
    - `unit_id` (string, required).
    - `check_in` (string, datetime validation, transform to Date).
    - `check_out` (string, datetime validation, transform to Date).
    - `source` (string, optional/required - default to 'direct' if missing or leave as is).

### 3.2. Controller Update (`src/controllers/webhook.controller.ts`)
The `handleBookingWebhook` method needs to adapt to the structure change.

**Requirements:**
- **Extraction:** extracting `unit_id` will now require accessing `payload.data.unit_id`.
- **Validation:**
    - Verify that the `account_id` provided in the payload matches the `unit.account_id` found in the database.
    - If they do NOT match, throw a `ValidationError` (security/integrity check).
- **Service Call:** Pass the transformed/mapped data to `webhookService`.

### 3.3. Service Update (`src/services/webhook.service.ts`)
The `processBookingWebhook` method logic needs to map the new input structure to the internal `IReservation` model.

**Requirements:**
- Update `processBookingWebhook` signature if strict typing is used (or just rely on the parsed Zod output).
- **Mapping:**
    - `start_date` = `payload.data.check_in`
    - `end_date` = `payload.data.check_out`
    - `listing_source` = `payload.data.source`
- **Idempotency:**
    - Ensure `event_id` and `type` (formerly `event_type`) are correctly stored in `WebhookEvent` collection.
    - The stored `payload` in `WebhookEvent` should be the *new* full payload.

## 4. Implementation Steps for Backend Agent
1.  **Modify `src/schemas/webhook.schema.ts`**: Update Zod schema.
2.  **Modify `src/controllers/webhook.controller.ts`**: Update extraction and add account ID validation.
3.  **Modify `src/services/webhook.service.ts`**: Update data mapping for Reservation creation.
4.  **Run Tests**: Verify changes ensure the new payload is accepted and processed correctly.

## 5. Example Request (Curl)
```bash
curl -X POST http://localhost:3000/webhooks/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "evt_test_001",
    "type": "booking_created",
    "account_id": "REPLACE_WITH_VALID_ACCOUNT_ID",
    "data": {
      "reservation_id": "res_test_001",
      "unit_id": "REPLACE_WITH_VALID_UNIT_ID",
      "check_in": "2026-10-01",
      "check_out": "2026-10-05",
      "source": "manual_test"
    }
  }'
```
