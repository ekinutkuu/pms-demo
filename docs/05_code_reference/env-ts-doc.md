About `env.ts`
Bu dosya `config` katmanının bir parçasıdır ve ortam değişkenlerini (özellikle `PORT`, `MONGO_URI`, `NODE_ENV`) tip güvenli şekilde okuyup, proje genelinde kullanılmak üzere `env` nesnesi altında toplar. Uygulamanın çalışma zamanı ayarlarını merkezileştirir ve eksik/zorunlu değişkenler için fail-fast davranışı uygular.

About `getEnvVar()`
Bu yardımcı fonksiyon, verilen ortam değişkenini okur, opsiyonel bir varsayılan değer uygular ve zorunlu değişken eksikse `Error` fırlatır. Böylece konfigürasyon hataları erken aşamada, uygulama ayağa kalkarken yakalanır.

About `env`
Bu obje, parse edilmiş ve tiplenmiş config değerlerini (`port`, `mongoUri`, `nodeEnv`) içerir ve diğer katmanlar tarafından doğrudan kullanılmak üzere dışa aktarılır. `NodeEnv` union tipi ile `NODE_ENV` alanı belirli string değerlerle sınırlandırılır.

