# About `Reservation.model.ts`

Defines the `Reservation` model, representing a booking for a specific unit over a date range.

## Schema: `ReservationSchema`

*   **Fields**:
    *   `account_id` (ObjectId, ref: 'Account', required): Tenant scope.
    *   `unit_id` (ObjectId, ref: 'Unit', required): The unit being booked.
    *   `start_date` (Date, required): Check-in date.
    *   `end_date` (Date, required): Check-out date.
    *   `status` (String, enum: ['confirmed', 'cancelled'], default: 'confirmed'): State of the reservation.
    *   `listing_source` (String, required): Origin of the booking (e.g., 'Airbnb', 'Direct').
*   **Indexes**:
    *   `{ account_id: 1, unit_id: 1, start_date: 1, end_date: 1 }`: **CRITICAL**. Supports the Efficient Sort Range (ESR) rule for overlapping date queries.

## Critical Rules

*   **Overlap Check**: Before creating a reservation, the system MUST check for overlapping existing reservations or availability blocks using the canonical logic: `(StartA < EndB) && (EndA > StartB)`.
