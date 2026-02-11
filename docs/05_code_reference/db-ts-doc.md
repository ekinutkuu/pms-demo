About `db.ts`
Bu dosya `config` katmanında yer alır ve MongoDB/Mongoose bağlantı sorumluluğunu üstlenir. Uygulamanın yaşam döngüsü boyunca tekil ve tekrar kullanılabilir bir Mongoose bağlantısı sağlamayı hedefler. Bağlantı kurulamazsa, uygulamayı fail-fast prensibiyle sonlandırarak hatalı/eksik altyapı üzerinde servis vermeyi engeller.

About `connectToDatabase()`
Bu async fonksiyon, mevcut Mongoose bağlantı durumunu kontrol eder; bağlantı zaten açıksa aynı bağlantıyı yeniden kullanır, değilse `env.mongoUri` üzerinden yeni bir bağlantı açar. Hata durumunda loglama yapar ve `process.exit(1)` çağırarak uygulamayı güvenli şekilde kapatır. İleride MongoDB replica set, transaction ve gelişmiş logging için genişletilmeye uygundur.

