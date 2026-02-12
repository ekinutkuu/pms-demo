# AvailabilityBlock Model Documentation

## About `AvailabilityBlock.model.ts`
Bu dosya, bir `Unit` (birim) için belirli tarih aralıklarının rezervasyona kapatılmasını temsil eden Mongoose şemasını ve modelini içerir. `models/` katmanında yer alır.

## Veri Modeli: `AvailabilityBlock`

### Alanlar (Fields)
- `account_id` (ObjectId, required): Kaydın ait olduğu tenant/hesap. `Account` modeline referans verir.
- `unit_id` (ObjectId, required): Bloğun ait olduğu birim. `Unit` modeline referans verir.
- `start_date` (Date, required): Bloğun başlangıç tarihi ve saati.
- `end_date` (Date, required): Bloğun bitiş tarihi ve saati.
- `reason` (String, optional): Bloğun oluşturulma nedeni (örneğin "Bakım", "Temizlik").
- `deletedAt` (Date, optional): Soft delete mekanizması için silinme tarihi.
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

### Validasyonlar
- **Tarih Sırası**: `end_date` değeri `start_date` değerinden sonra olmalıdır. Bu validasyon Mongoose şema validatörü ile sağlanır.

### İndeksler
- **Overlap İndeksi**: `{ account_id: 1, unit_id: 1, start_date: 1, end_date: 1 }`
  - Bu bileşik indeks, belirli bir birim ve tarih aralığındaki çakışmaları (overlap) sorgularken performansı optimize eder.

### İlişkiler
- **Account**: Her blok bir hesaba aittir.
- **Unit**: Her blok bir birime aittir.
