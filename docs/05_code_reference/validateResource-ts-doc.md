# ValidateResource Middleware Documentation

About `validateResource.ts`
Bu dosya, gelen HTTP isteklerinin (body, query, params) Zod şemalarına göre doğrulanmasını sağlayan middleware'i içerir. `middlewares/` dizininde bulunur.

## Fonksiyonlar

### About `validateResource(schema)`
Higher-order function (HOF) yapısındadır. Bir Zod şeması alır ve Express middleware'i döndürür.

- **Amaç**: Controller katmanına geçmeden önce verinin formatını ve kurallara uygunluğunu garanti altına almak.
- **Parametreler**:
  - `schema` (ZodSchema): Doğrulama için kullanılacak Zod şeması.
- **Çalışma Mantığı**:
  - `req.body`, `req.query` ve `req.params` nesnelerini `schema.parse()` ile doğrular.
- **Hata Yönetimi**:
  - Validasyon başarısız olursa `400 Bad Request` ve hata detaylarını (`errors`) içeren bir JSON yanıtı döner.
  - Beklenmeyen hataları `next(e)` ile global hata yakalayıcıya iletir.
