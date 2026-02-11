About `errorHandler.ts`
Bu dosya `middlewares` katmanının bir parçasıdır ve HTTP seviyesinde hata yakalama, 404 üretme ve tutarlı JSON hata cevabı üretme görevlerini üstlenir. Controller ve servis katmanlarından fırlayan hataları merkezi bir noktada toplayarak, API tüketicilerine sade ama tutarlı bir cevap dönerken, sunucu tarafında detaylı loglama yapılmasına zemin hazırlar.

About `HttpError`
Bu sınıf, HTTP tabanlı domain hatalarını temsil eden basit ama genişletilebilir bir error tipidir. `statusCode` ve `message` alanları ile birlikte, gelecekte `ValidationError`, `ConflictError` gibi daha spesifik hata sınıflarının türeyeceği base type olarak düşünülmüştür.

About `notFoundHandler()`
Bu middleware, tanımlanmamış route'lar için devreye girer ve `404` durum kodu ile standart bir JSON cevap döner. Cevap içinde istenen path bilgisi de verilerek debugging sürecini kolaylaştırır.

About `errorHandler()`
Bu global hata yakalama middleware'i, uygulama içindeki diğer middleware ve route handler'lardan fırlayan hataları karşılar. `HttpError` tipindekileri uygun HTTP koduna dönüştürür, diğer beklenmeyen hatalar için `500` döner. Aynı zamanda sunucu tarafında hatayı loglar; ileride daha kapsamlı bir logger entegrasyonu için uygun bir merkez noktadır.

