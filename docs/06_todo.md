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
- [ ] Mongoose connection with fail-fast logic
- [ ] Enable transactions (session support)
- [ ] Define base schema fields:
  - account_id
  - createdAt / updatedAt
- [ ] Centralize index definitions

---

## 4. Domain Models
### Account
- [ ] Account schema
- [ ] Status control (active / inactive)

### Unit
- [ ] Unit belongs to Account
- [ ] Enforce account ownership at query level

---

## 5. Reservation Model (Critical)
- [ ] Reservation schema
  - account_id
  - unit_id
  - check_in
  - check_out
  - source
- [ ] Compound index:
  - account_id + unit_id + check_in + check_out
- [ ] Schema-level date validation

---

## 6. AvailabilityBlock Model
- [ ] AvailabilityBlock schema
- [ ] Validate `end_date > start_date`
- [ ] Index:
  - account_id + unit_id + start_date + end_date

---

## 7. WebhookEvent Model & Idempotency Flow
- [ ] WebhookEvent schema
  - event_id (unique)
  - account_id
  - type
  - status
- [ ] Unique index on `event_id`
- [ ] Idempotency flow:
  - Insert event → process → mark processed

---

## 8. Validation Layer
- [ ] Payload validation (Zod / Joi)
- [ ] Webhook payload schema
- [ ] Availability payload schema
- [ ] Unified 400 response format

---

## 9. Conflict Detection Logic
- [ ] Reservation overlap logic
- [ ] Block overlap logic
- [ ] Deterministic query ordering
- [ ] Unit tests for edge cases

---

## 10. Reservation Creation Service (Atomic)
- [ ] Start MongoDB session
- [ ] Check overlapping reservations
- [ ] Check availability blocks
- [ ] Create reservation
- [ ] Commit transaction

---

## 11. Booking Webhook Endpoint
- [ ] `POST /webhooks/bookings`
- [ ] Validate payload
- [ ] Insert webhook event (idempotency)
- [ ] Run reservation creation in same transaction
- [ ] Response strategy:
  - 201 → created
  - 200 → already processed
  - 409 → conflict
  - 400 → validation error

---

## 12. Availability Block Endpoint
- [ ] `POST /units/:unitId/availability/close`
- [ ] Validate account ownership
- [ ] Check conflicts with future reservations
- [ ] Insert block

---

## 13. Error Handling
- [ ] Domain error classes
- [ ] Central error mapper
- [ ] Consistent API error format

---

## 14. Concurrency Strategy (MANDATORY)
- [ ] Single transaction per booking event
- [ ] Read → validate → write flow
- [ ] README explanation:
  - Why transactions
  - How double booking is prevented

---

## 15. Security (Bonus)
- [ ] Webhook signature validation
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