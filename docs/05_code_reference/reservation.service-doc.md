# About `reservation.service.ts`

Handles domain logic for reservations, specifically creation and conflict detection.

## Functions

### `createReservation(data, session)`

*   **Purpose**: Creates a new reservation atomically.
*   **Safety**:
    *   Validates required fields.
    *   **CRITICAL**: Calls `_checkConflicts` before insertion.
    *   Uses MongoDB `session` to ensure it's part of the transaction.
*   **Returns**: Created `IReservation` document.

### `_checkConflicts(account_id, unit_id, start, end, session)`

*   **Purpose**: Checks for overlapping reservations OR availability blocks.
*   **Logic**:
    *   Rule: `(Existing.start < New.end) && (Existing.end > New.start)`
    *   Ignores `cancelled` reservations.
*   **Throws**: `ConflictError` (409) if an overlap is found.
