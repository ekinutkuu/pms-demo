# About `AvailabilityBlock.model.ts`

Defines the `AvailabilityBlock` model, representing a period where a unit is unavailable (e.g., maintenance, manual hold).

## Schema: `AvailabilityBlockSchema`

*   **Fields**:
    *   `account_id` (ObjectId, ref: 'Account', required): Tenant scope.
    *   `unit_id` (ObjectId, ref: 'Unit', required): The unit being blocked.
    *   `start_date` (Date, required): Start of the block.
    *   `end_date` (Date, required): End of the block.
    *   `reason` (String, optional): Reason for the block.
*   **Indexes**:
    *   `{ account_id: 1, unit_id: 1, start_date: 1, end_date: 1 }`: Supports overlap queries similar to reservations.

## Usage

*   Blocks availability just like a reservation.
*   Must be checked during reservation creation to prevent double booking.
