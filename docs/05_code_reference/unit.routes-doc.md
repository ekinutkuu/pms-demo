# Unit Routes Documentation

About `unit.routes.ts`
Bu dosya, birim ("unit") ile ilgili endpoint'lerin tanımlandığı router dosyasıdır. `routes/` dizininde bulunur.

## Endpoint'ler

### `POST /units/:unitId/availability`
Belirtilen birimin belirli tarihlerde müsaitliğini kapatır ( availability block oluşturur ).

- **Middleware**:
  - `accountScope`: İsteğin tenant bağlamını (`req.context.accountId`) ayarlar.
  - `validateResource(CreateAvailabilityBlockSchema)`: Request body ve params validasyonunu yapar.
- **Controller**: `availabilityController.createBlock`
