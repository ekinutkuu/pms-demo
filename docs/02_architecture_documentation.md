# Architecture Documentation

## 1. Overview

This document describes the **high-level architecture and design decisions** for the multi-tenant SaaS Property Management System (PMS). The goal is to ensure correctness, scalability, tenant isolation, and safety under concurrency.

The system is designed using **Clean Architecture principles**, with strict separation between:

* HTTP / transport layer
* Application (use-case) layer
* Domain logic
* Infrastructure (MongoDB, external integrations)

> **Core principle:** No business rule depends on Express, MongoDB, or any framework-specific detail.

---

## 2. Architectural Goals

* Strong **multi-tenant isolation** (account-scoped everything)
* Deterministic behavior under **concurrent booking attempts**
* Guaranteed **idempotency** for webhook processing
* Clear boundaries between layers
* Explicit, intentional MongoDB indexing
* Production-grade error handling & observability readiness

---

## 3. High-Level Architecture

```
┌─────────────┐
│   Client    │
│ (Webhook / │
│   API)     │
└─────┬───────┘
      │ HTTP
┌─────▼──────────────────────────┐
│        Express Controller       │
│  (request mapping & response)  │
└─────┬──────────────────────────┘
      │ DTOs
┌─────▼──────────────────────────┐
│        Application Layer        │
│   (Use Cases / Services)        │
└─────┬──────────────────────────┘
      │ Domain Calls
┌─────▼──────────────────────────┐
│          Domain Layer           │
│ (Reservation rules, conflicts) │
└─────┬──────────────────────────┘
      │ Repositories
┌─────▼──────────────────────────┐
│      Infrastructure Layer      │
│   (MongoDB, Mongoose, Indexes) │
└────────────────────────────────┘
```

---

## 4. Folder Structure

```
src/
├── app.ts                  # Express app setup (middlewares, routes)
├── server.ts               # HTTP server bootstrap
├── config/
│   ├── env.ts              # Environment variables validation
│   ├── database.ts         # MongoDB connection
│   └── index.ts
│
├── routes/
│   ├── index.ts            # Route aggregator
│   ├── webhook.routes.ts   # /webhooks/*
│   └── unit.routes.ts      # /units/*
│
├── controllers/
│   ├── webhook.controller.ts
│   └── availability.controller.ts
│
├── services/
│   ├── reservation.service.ts
│   ├── availability.service.ts
│   ├── webhook.service.ts
│   └── unit.service.ts
│
├── models/
│   ├── Account.model.ts
│   ├── Unit.model.ts
│   ├── Reservation.model.ts
│   ├── AvailabilityBlock.model.ts
│   ├── WebhookEvent.model.ts
│   └── index.ts
│
├── middlewares/
│   ├── accountScope.ts             # account scope / RequestContext.accountId
│   ├── validateRequest.middleware.ts
│   ├── errorHandler.middleware.ts
│   ├── webhookAuth.middleware.ts   # (bonus)
│   └── rateLimit.middleware.ts     # (bonus)
│
├── utils/
│   ├── date.utils.ts
│   ├── mongo.utils.ts
│   ├── errors.ts
│   └── logger.ts
│
├── types/
│   ├── webhook.types.ts
│   └── common.types.ts
│
└── docs/  #documents for project
```

### Responsibility Boundaries

* **Controllers**: HTTP only (no logic)
* **Services (Application Layer)**: orchestration, transactions
* **Domain**: pure business rules
* **Infrastructure**: persistence details

---

## 5. Multi-Tenant Isolation Strategy

### Rule

> Every request is scoped by `account_id`. No exception.

### Enforcement Points

* Extract `account_id` from:

* JWT (API requests)
* Webhook payload mapping
* HTTP katmanında `accountScope` middleware'i ile `RequestContext.accountId` üretimi
* Repository layer **requires** `account_id` parameter
* No repository method exists without `account_id`

### Why this works

* Prevents accidental cross-tenant reads
* Forces developers to think tenant-first
* Enables future sharding by `account_id`

---

## 6. Domain Model Overview

### Entities

* **Account** – tenant boundary
* **Unit** – belongs to Account
* **Reservation** – booking record
* **AvailabilityBlock** – manual or system blocks
* **WebhookEvent** – idempotency ledger

All entities contain:

* `account_id`
* `created_at`, `updated_at`

---

## 7. Concurrency & Consistency Model

### Key Risks

* Double booking
* Race conditions
* Duplicate webhook events

### Strategy

* MongoDB **transactions** (replica set required)
* Unique indexes for idempotency
* Conflict queries inside the same transaction

### Why MongoDB Transactions

* Guarantees atomicity across:

  * WebhookEvent insert
  * Conflict check
  * Reservation creation

---

## 8. Idempotency Architecture

```
Webhook Request
      │
      ▼
Insert WebhookEvent (unique index)
      │
  success?
   │      │
 yes     no
  │       └─► return 200 (duplicate)
  ▼
Process Reservation
```

* **Single source of truth**: `WebhookEvent`
* Unique index on `(account_id, event_id)`

---

## 9. Error Handling Philosophy

* Domain errors are explicit
* Infrastructure errors are wrapped
* Controllers map errors → HTTP codes

Example:

* `ConflictError` → 409
* `ValidationError` → 400
* `UnauthorizedError` → 401

---

## 10. Security Architecture (Proposed)

* JWT-based authentication for APIs
* Webhook signature validation
* Rate limiting on `/webhooks/bookings`
* Centralized input validation middleware

---

## 11. Trade-offs & Assumptions

### Assumptions

* MongoDB runs as a replica set
* Webhook retries are expected
* Event order is not guaranteed

### Trade-offs

* Transactions add latency → correctness preferred
* Explicit tenant scoping → more boilerplate, safer system

---

## 12. Summary

This architecture prioritizes **correctness, clarity, and safety under concurrency**. It intentionally avoids clever shortcuts in favor of explicit, debuggable, production-ready behavior.
