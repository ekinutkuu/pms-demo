# Technical Documentation

## 1. Introduction

This document explains **implementation-level details** of the PMS backend. It is intended to guide actual coding, reviews, and future maintenance.

---

## 2. MongoDB Schemas & Indexes

### 2.1 Account

```ts
Account {
  _id: ObjectId
  name: string
}
```

Indexes:

* `_id` (default)

---

### 2.2 Unit

```ts
Unit {
  _id: ObjectId
  account_id: ObjectId
  name: string
}
```

Indexes:

* `{ account_id: 1 }`

---

### 2.3 Reservation

```ts
Reservation {
  _id: ObjectId
  account_id: ObjectId
  unit_id: ObjectId
  start: Date
  end: Date
}
```

Indexes:

* `{ account_id: 1, unit_id: 1, start: 1, end: 1 }`

Purpose:

* Efficient overlap detection

---

### 2.4 AvailabilityBlock

```ts
AvailabilityBlock {
  _id: ObjectId
  account_id: ObjectId
  unit_id: ObjectId
  start: Date
  end: Date
}
```

Indexes:

* `{ account_id: 1, unit_id: 1, start: 1, end: 1 }`

---

### 2.5 WebhookEvent

```ts
WebhookEvent {
  _id: ObjectId
  account_id: ObjectId
  event_id: string
  processed_at: Date
}
```

Indexes:

* **UNIQUE** `{ account_id: 1, event_id: 1 }`

Guarantees:

* Idempotency at database level

---

## 3. Overlap Detection Logic

**Canonical rule (used everywhere):**

```
A.start < B.end AND A.end > B.start
```

MongoDB query example:

```ts
{
  account_id,
  unit_id,
  start: { $lt: end },
  end: { $gt: start }
}
```

---

## 4. Webhook Processing Flow

1. Validate payload
2. Start MongoDB transaction
3. Insert WebhookEvent
4. Check Reservation conflicts
5. Check AvailabilityBlock conflicts
6. Insert Reservation
7. Commit transaction

If step 3 fails → duplicate → return 200

---

## 5. Idempotency Under Concurrency

### Scenario

Two identical webhook events arrive simultaneously.

### Outcome

* One insert succeeds
* One fails on unique index
* Second request exits safely

### Why this is safe

* Database-enforced guarantee
* No race window

---

## 6. Double Booking Prevention

### Scenario

Two overlapping bookings arrive at same time.

### Handling

* Both start transaction
* Both pass idempotency
* First commits reservation
* Second fails conflict query

Result:

* Exactly one reservation exists

---

## 7. HTTP Status Codes

| Scenario          | Code |
| ----------------- | ---- |
| Success           | 201  |
| Duplicate webhook | 200  |
| Conflict          | 409  |
| Validation error  | 400  |
| Unauthorized      | 401  |

**Why 200 for duplicate?**
Webhook providers treat non-2xx as retry-worthy.

---

## 8. Middleware Stack
 
* Request validation (Zod / Joi)
* Account context resolver (`accountScope` middleware'i, `x-account-id` header'ından `RequestContext.accountId` üretir ve header olmayan istekleri 401 ile reddeder)
* Rate limiter (webhooks)
* Error handler

---

## 9. Error Classes

* `ValidationError`
* `ConflictError`
* `NotFoundError`
* `UnauthorizedError`

All extend `BaseError`.

---

## 10. Testing Strategy

### Must-Test Scenarios

* Duplicate webhook delivery
* Concurrent overlapping bookings
* Cross-account access attempt
* Blocked date booking

### Recommended Tools

* Jest
* MongoDB Memory Server

---

## 11. README Guidance

README should include:

* Setup instructions
* MongoDB replica set note
* Webhook example curl
* Idempotency explanation
* Concurrency explanation

---

## 12. Final Notes

This design intentionally favors **predictability and correctness** over minimal code. Every index, transaction, and constraint exists to prevent real-world production failures.
