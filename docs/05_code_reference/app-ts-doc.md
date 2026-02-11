About `app.ts`
Bu dosya HTTP katmanının giriş noktalarından biridir ve Express uygulamasının konfigürasyonundan sorumludur. JSON body parsing, health check endpoint'i, tenant bazlı account scope middleware'i, ileride eklenecek router'lar ve 404/global hata yakalama middleware'leri burada bir araya getirilir. Böylece `server.ts` sadece sunucu başlatma ile ilgilenirken, HTTP request lifecycle'ın iskeleti bu dosyada tanımlanır.

About `createApp()`
Bu fonksiyon yeni bir Express uygulaması oluşturur, `express.json()` ile JSON gövde parse edilmesini sağlar ve `/health` endpoint'ini kaydeder. `/health` endpoint'i, servis ayakta mı, uptime süresi ve zaman damgası gibi basit ama faydalı metrikler döner ve tenant'tan bağımsız çalışacak şekilde account scope middleware'inden önce tanımlanır. `accountScope` middleware'i, bu fonksiyon içinde global olarak mount edilerek tüm tenant bazlı endpoint'ler için `RequestContext.accountId` üretir. Fonksiyon sonunda, 404 ve global `errorHandler` middleware'leri eklenerek, tüm isteklerin standart bir hata yolundan geçmesi garanti altına alınır. Fonksiyon, test edilebilirlik ve yeniden kullanılabilirlik için `app` instance'ını geri döner.

