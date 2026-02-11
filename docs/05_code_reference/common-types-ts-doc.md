About `common.types.ts`
Bu dosya `types` katmanının bir parçasıdır ve HTTP istekleri boyunca taşınan ortak tipleri tanımlar. Özellikle, çok kiracılı mimaride her isteğin hangi tenant'a ait olduğunu temsil eden `RequestContext` arayüzünün kanonik tanımı burada tutulur. Böylece controller ve servis katmanları, tenant bilgisini tip güvenli bir şekilde kullanabilir.

About `RequestContext`
`RequestContext` arayüzü, her HTTP isteği için zorunlu tenant kimliğini (`accountId`) ve gelecekte eklenecek isteğe bağlı context alanlarını (örneğin `requestId`, `userId`, `locale` vb.) taşımak üzere tasarlanmıştır. Bu tip, Express `Request` tipinin module augmentation ile genişletilmesi sayesinde `req.context` altında kullanılır; böylece tüm domain ve repository operasyonlarının accountId ile scope edilmesi kuralı tip seviyesinde de zorlanır. İleride servis imzalarının doğrudan `RequestContext` veya `accountId: string` parametresi alması için temel referans tip bu arayüzdür.

About `ScopedRequest`
`ScopedRequest` tipi, `accountScope` middleware'i sonrasında çalışan controller handler'larında kullanılmak üzere tanımlanmış yardımcı bir tiptir. Bu tipte `context` alanı artık optional değildir; böylece bu handler'lar içinde `req.context.accountId` ifadesi ek null check yazmaya gerek kalmadan tip güvenli şekilde kullanılabilir. Router tanımlarında, accountScope'tan sonra çağrılan handler imzalarını `ScopedRequest` ile yazarak, middleware sırasına bağlı bu garanti TypeScript seviyesinde de enforce edilebilir.


