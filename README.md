Currently under development...

## Account Scope & Güvenlik Notu

Bu projede tüm domain endpoint'leri tenant bazlı çalışır ve tenant kimliği `RequestContext.accountId` üzerinden zorunludur. Şu an iskelet aşamasında bu değer `accountScope` middleware'i tarafından `x-account-id` header'ından üretilmektedir; ancak bu header **nihai otorite** olarak düşünülmemelidir. Üretim ortamında `accountId`, JWT claim'i, webhook imza doğrulaması veya provider → account mapping gibi daha güvenilir bir auth/integasyon katmanının çıktısı olacak; `x-account-id` ise en fazla bu mekanizmanın dışa vurduğu, doğrulanmış değeri taşıyan bir taşıyıcı olarak kullanılacaktır. Bu repo şu an teknik bir task kapsamında olduğundan, söz konusu auth/signature katmanı henüz implement edilmemiştir ve `x-account-id` yalnızca bu amaçla placeholder olarak kullanılmaktadır.

Router helper ve gerçek auth/signature katmanını, ilk gerçek endpoint’ler (özellikle /webhooks/bookings) eklendiği anda tekrar kontrol edilip gerekli işlemler yapılacaktır.