# About `webhook.controller.ts`

Handles HTTP requests for webhook events.

## Functions

### `handleBookingWebhook(req, res, next)`

*   **Purpose**: Entry point for `POST /webhooks/bookings`.
*   **Payload Yapısı (Nested)**:
    ```json
    {
      "event_id": "evt_001",
      "type": "booking_created",
      "account_id": "acc_123",
      "data": {
        "reservation_id": "res_001",
        "unit_id": "unit_10",
        "check_in": "2026-08-10T00:00:00Z",
        "check_out": "2026-08-15T00:00:00Z",
        "source": "airbnb"
      }
    }
    ```
*   **Behavior**:
    1.  **Zod Validation**: `BookingWebhookSchema` ile nested payload doğrulanır.
    2.  **Unit Lookup**: `payload.data.unit_id` üzerinden Unit bulunur.
    3.  **Account ID Doğrulaması**: `payload.account_id` ile `unit.account_id` karşılaştırılır. Eşleşmezse `ValidationError` fırlatılır (güvenlik/bütünlük kontrolü).
    4.  **Service Call**: Doğrulanmış payload `WebhookService.processBookingWebhook`'a aktarılır.
    5.  **Response**:
        *   `201 Created`: Yeni rezervasyon oluşturuldu.
        *   `200 OK`: Event zaten işlenmiş (Idempotency).
    6.  **Error Handling**: Hatalar `next()` ile global error handler'a iletilir.
