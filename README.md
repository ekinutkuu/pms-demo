Currently under development...

## Account Scope & Güvenlik Notu

Bu projede tüm domain endpoint'leri tenant bazlı çalışır ve tenant kimliği `RequestContext.accountId` üzerinden zorunludur. Şu an iskelet aşamasında bu değer `accountScope` middleware'i tarafından `x-account-id` header'ından üretilmektedir; ancak bu header **nihai otorite** olarak düşünülmemelidir. Üretim ortamında `accountId`, JWT claim'i, webhook imza doğrulaması veya provider → account mapping gibi daha güvenilir bir auth/integasyon katmanının çıktısı olacak; `x-account-id` ise en fazla bu mekanizmanın dışa vurduğu, doğrulanmış değeri taşıyan bir taşıyıcı olarak kullanılacaktır. Bu repo şu an teknik bir task kapsamında olduğundan, söz konusu auth/signature katmanı henüz implement edilmemiştir ve `x-account-id` yalnızca bu amaçla placeholder olarak kullanılmaktadır.

Router helper ve gerçek auth/signature katmanını, ilk gerçek endpoint’ler (özellikle /webhooks/bookings) eklendiği anda tekrar kontrol edilip gerekli işlemler yapılacaktır.

## Notes
- Idempotency: Aynı event_id ve account_id ile gelen istekler mükerrer işlem yapmaz, 200 OK döner.
- Domain Logic: Tarih aralığında (start < end && end > start) çakışma varsa 409 Conflict döner.

# Short-term Rental PMS Backend

This is a **SaaS product backend** for managing short-term rental properties, built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (v6.0+) configured as a **Replica Set**

### Local Development (Important!)

This project uses **MongoDB Transactions**, which require a **Replica Set**. A standalone MongoDB instance will cause `Transaction numbers are only allowed on a replica set member` error.

**How to run MongoDB locally with Replica Set:**

1.  Stop your current MongoDB service or process. (in admin powershell run the `net stop MongoDB` command)
2.  Start `mongod` with the `--replSet` flag:
    ```powershell
    mongod --replSet rs0 --dbpath "C:\mongodb\pms-demo"
    ```
3.  In a separate terminal, connect to mongo shell (`mongosh`) and initiate the set:
    ```javascript
    rs.initiate()
    ```
4.  You should see the prompt change to `rs0:PRIMARY>`.

### Environment Variables

Create a `.env` file in the root directory:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/pms-db
NODE_ENV=development
```

### Running the App

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

---

## 🏗️ Architecture

- **Multi-tenant**: All data is scoped by `account_id`.
- **Idempotency**: Webhook events (`event_id`) are processed exactly once.
- **Concurrency**: Transactions prevent double bookings (overlapping dates).

### Conflict Logic
Two reservations overlap if: `(Start A < End B) AND (End A > Start B)`.

---

## 🧪 Testing

You can test the `POST /webhooks/bookings` endpoint using the example in `skill/demo-agent`.

### Example Curl

```bash
curl -X POST http://localhost:3000/webhooks/bookings \
  -H "Content-Type: application/json" \
  -H "x-account-id: 65c4d8e9f1a2b3c4d5e6f7a9" \
  -d '{
    "event_id": "evt_test_01",
    "event_type": "booking.created",
    "unit_id": "65c4d8e9f1a2b3c4d5e6f7a8",
    "start_date": "2024-06-01T10:00:00Z",
    "end_date": "2024-06-05T10:00:00Z",
    "guest_name": "Test User",
    "listing_source": "airbnb"
  }'
```