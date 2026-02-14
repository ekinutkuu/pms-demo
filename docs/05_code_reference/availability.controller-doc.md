# AvailabilityController Documentation

About `availability.controller.ts`
Bu dosya, müsaitlik blokları ile ilgili HTTP isteklerini karşılayan ve uygun servislere yönlendiren controller katmanıdır. `controllers/` dizininde bulunur.

## Fonksiyonlar / Handlerlar

### About `createBlock`
`POST /units/:unitId/availability/close` isteğini karşılar.

- **Amaç**: İstemciden gelen blok oluşturma isteğini alıp `AvailabilityService`'e iletmek ve sonucu döndürmek.
- **Girdi**:
  - `req.params.unitId`: URL'den gelen birim ID.
  - `req.body`: `start_date`, `end_date`, `source`.
  - `req.context.accountId`: Middleware tarafından sağlanan tenant ID.
- **Çıktı**:
  - Başarılı durumda `201 Created` ve oluşturulan blok verisi.
  - Hata durumunda global error handler'a yönlendirme (next).
