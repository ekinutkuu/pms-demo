# Backend Development To-Do List

---

## 0. Architecture & Assumptions
- [ ] Define core assumptions:
  - MongoDB runs as Replica Set (transactions enabled)
  - account_id is mandatory for **all** domain operations
- [ ] Document assumptions in README

---

## 1. Project Bootstrap & Core Setup
- [x] Initialize Node.js + Express + TypeScript
- [x] Enable strict TypeScript config
- [x] ESLint + Prettier
- [x] Environment config (`PORT`, `MONGO_URI`, `NODE_ENV`)
- [x] Base Express server
- [x] Base Mongo connection
- [x] Global error handler
- [x] Health check (`GET /health`)
- [x] Create .env.example

---

## 2. Request Lifecycle & Account Context (MOVED UP)
- [x] Define `RequestContext`
- [x] Extract `account_id` from header (`x-account-id`) via `accountScope` middleware (JWT/token entegrasyonu ileride eklenecektir)
- [x] Inject account context into request
- [x] Reject requests without account scope

---

## 3. MongoDB Connection & Index Strategy
- [x] Mongoose connection with fail-fast logic (`src/config/db.ts`)
- [x] Enable transactions (session support)
- [x] Define base schema fields:
  - account_id
  - createdAt / updatedAt
- [x] Centralize index definitions

---

## 4. Domain Models
### Account
- [x] Account schema
- [x] Status control (active / inactive)

### Unit
- [x] Unit belongs to Account
- [x] Enforce account ownership at query level

---

## 5. Reservation Model (Critical)
- [x] Reservation schema
  - account_id
  - unit_id
  - check_in
  - check_out
  - source
- [x] Compound index:
  - account_id + unit_id + check_in + check_out
- [x] Schema-level date validation

---

## 6. AvailabilityBlock Model
- [x] AvailabilityBlock schema
- [x] Validate `end_date > start_date`
- [x] Index:
  - account_id + unit_id + start_date + end_date

---

## 7. WebhookEvent Model & Idempotency Flow
- [x] WebhookEvent schema
  - event_id (unique)
  - account_id
  - type
  - status
- [x] Unique index on `event_id`
- [x] Idempotency flow:
  - [x] Insert event → process → mark processed

---

## 8. Validation Layer
- [x] Payload validation (Zod / Joi)
- [x] Webhook payload schema
- [x] Availability Payload Schema
- [x] Unified 400 response format

---

## 9. Conflict Detection Logic
- [x] Reservation overlap logic
- [x] Block overlap logic
- [x] Deterministic query ordering
- [x] Unit tests for edge cases

---

## 10. Reservation Creation Service (Atomic)
- [x] Start MongoDB session
- [x] Check overlapping reservations
- [x] Check availability blocks
- [x] Create reservation
- [x] Commit transaction

---

## 11. Booking Webhook Endpoint
- [x] `POST /webhooks/bookings`
- [x] Validate payload
- [x] Insert webhook event (idempotency)
- [x] Run reservation creation in same transaction
- [x] Response strategy:
  - 201 → created
  - 200 → already processed
  - 409 → conflict
  - 400 → validation error

---

## 12. Availability Block Endpoint
- [x] `POST /units/:unitId/availability`
- [x] Validate account ownership
- [x] Check conflicts with future reservations
- [x] Insert block

---

## 13. Error Handling
- [x] Domain error classes
- [x] Central error mapper
- [x] Consistent API error format

---

## 14. Concurrency Strategy (MANDATORY)
- [x] Single transaction per booking event
- [x] Read → validate → write flow
- [x] README explanation:
  - Why transactions
  - How double booking is prevented

---

## 15. Security (Bonus)
- [X] Webhook signature validation
- [ ] Rate limiting
- [ ] Helmet
- [ ] JWT auth (optional)

---

## 16. Testing
- [ ] Unit tests:
  - Overlap logic
  - Idempotency
- [ ] Integration tests:
  - Concurrent webhook simulation
- [ ] In-memory MongoDB

---

## 17. Documentation & Submission
- [ ] README:
  - Setup
  - Assumptions
  - Concurrency handling
- [ ] Example curl requests
- [ ] Final cleanup