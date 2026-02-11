About `server.ts`
Bu dosya, uygulamanın gerçek Node.js HTTP sunucusunu ayağa kaldıran bootstrap katmanıdır. Sorumluluğu; önce veritabanı bağlantısını kurmak, ardından Express uygulamasını oluşturmak ve konfigüre edilen port üzerinde dinlemeyi başlatmaktır. Böylece konfigürasyon (`env.ts`), veritabanı (`db.ts`) ve HTTP uygulaması (`app.ts`) arasında net bir ayrım korunur.

About `bootstrap()`
Bu async fonksiyon, start-up sırasını tanımlar: önce `connectToDatabase()` ile MongoDB bağlantısını kurar, sonra `createApp()` ile Express instance'ını alır ve `http.createServer` ile bir HTTP sunucusu oluşturur. Son adımda, `env.port` üzerinde dinlemeyi başlatır ve basit bir log yazar. Fonksiyon `void bootstrap()` çağrısıyla tetiklenir; ileride graceful shutdown, sinyal yakalama ve daha gelişmiş start-up senaryoları için genişlemeye açıktır.

