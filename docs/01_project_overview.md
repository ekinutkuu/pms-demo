# Project Documentation

We are building a **SaaS product** that manages **short-term rental properties** (similar to a lightweight **PMS – Property Management System**).

---

## 1. What We Want to See

Your task is to implement a **minimal backend system** that:

- Supports **multi-tenant structure** (user & organisation)
- Handles **booking webhooks** (event-driven)
- Manages **availability**
- Prevents **double booking**
- Maintains **data consistency**
- Ensures **secure operation**

---

## 1.1 Stack Requirements

The backend must be implemented using:

- **Node.js**
- **Express**
- **TypeScript**
- **MongoDB**

---

## 1.2 Multi-Tenant Structure

Implement the following models:

- **Account**
- **Unit** (belongs to an Account)
- **Reservation**
- **AvailabilityBlock**
- **WebhookEvent**

Each **Account** can own multiple **Units**.

> ⚠️ All operations **must be scoped to an Account**.

---

## 2. Booking Webhook Endpoint

Create the following endpoint:

```http
POST /webhooks/bookings
```

### Sample Payload

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

---

### 2.1 Requirements

The endpoint must:

- Be **idempotent** (the same `event_id` must not be processed twice)
- Create a **reservation record**
- Reject reservations if **dates overlap**
- Reject reservations if **dates are blocked**
- Return **proper HTTP status codes**
- Handle **validation errors** correctly

---

## 3. Availability Block API

Create the following endpoint:

```http
POST /units/:unitId/availability/close
```

### Sample Payload

```json
{
  "unit_id": "some_unit_id_387384",
  "start_date": "2026-08-20",
  "end_date": "2026-08-25",
  "source": "ownerBlocked"
}
```

### Requirements

- Store the **availability block**
- Validate date logic (`end_date > start_date`)
- Prevent **future reservations** on blocked dates

---

## 4. Conflict Detection Logic

Two reservations **overlap** if:

```text
A.start < B.end AND A.end > B.start
```

This logic **must be implemented correctly**.

The system must prevent:

- Overlapping reservations
- Reservations on blocked dates

---

## 5. Required Database Indexes

For performance reasons, the system must include:

- **Unique index** on `event_id` (for webhook idempotency)
- **Compound index** on `unit_id + check_in + check_out`
- **Index** on `account_id`

> Any **additional indexes** must be clearly explained.

---

## 6. Expected Project Structure

```text
src/
├── controllers/
├── routes/
├── models/
├── services/
├── middlewares/
└── utils/
```

---

## Concurrency Scenario (Important)

If **two booking events** for the **same unit** and **overlapping dates** arrive at the **same time**:

- The system **must not allow double booking**
- In your **README**, briefly explain **how your implementation handles this**

---

## Bonus Points

- Login / Logout logic with **JWT**
- **Webhook signature validation**
- **Request validation middleware**
- **Unit tests** (especially for idempotency & overlap logic)
- Proper **error handling** (layered if possible)
- **Rate limiting middleware**

---

## Expected Time

**4–6 hours** of focused work.

This is **not expected to be production-ready**, but:

- Code must be **clean**
- Structure must be **clear**
- Logic must be **correct**
- Indexing must be **intentional**

---

## Submission Requirements

Please provide:

1. **Git repository link**
2. **README** containing:
   - Setup instructions
   - How to run the project
   - Explanation of the conflict-handling approach
3. Example **curl requests** to test endpoints

---

## Evaluation Criteria

We will evaluate:

- Architecture & separation of concerns
- Idempotency handling
- Conflict detection correctness
- MongoDB indexing awareness
- Multi-tenant design thinking
- Error handling quality
- Code readability
- Engineering judgment

---

## Last Note

If anything is unclear, feel free to make **reasonable assumptions** and **document them clearly**.
