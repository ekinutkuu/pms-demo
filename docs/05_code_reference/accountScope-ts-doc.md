About `accountScope.ts`
Bu dosya `middlewares` katmanının bir parçasıdır ve HTTP istekleri için tenant kapsamını (account scope) üretmekten sorumludur. Çok kiracılı mimaride her isteğin mutlaka bir `account_id` ile ilişkilendirilmesi gerektiği kuralını, HTTP seviyesinde enforce eden temel bileşendir. Böylece domain ve repository katmanları yalnızca önceden belirlenmiş bir tenant context'i altında çalışır.

About `accountScope()`
`accountScope` middleware'i, gelen HTTP isteğinin `x-account-id` header'ını okuyarak zorunlu tenant kimliğini çıkarır, değeri trim ederek doğrular ve geçerliyse `req.context.accountId` alanına yazar. Header eksik veya boş ise `HttpError` ile `401 Unauthorized` fırlatır; bu hata global `errorHandler` tarafından standart JSON response'a dönüştürülür. Middleware, `app.ts` içinde health endpoint'inden sonra, diğer tüm router'lardan önce global olarak mount edildiği için, health gibi tenant'tan bağımsız endpoint'ler bu kontrolden muaf kalırken, tüm domain odaklı endpoint'ler için account scope zorunlu hale gelir. Gerçek bir üretim senaryosunda ise `x-account-id`, ham client input'u olarak değil; JWT claim'i, webhook imza doğrulaması veya provider → account mapping gibi daha güvenilir bir mekanizmanın çıktısı olarak düşünülmelidir.


