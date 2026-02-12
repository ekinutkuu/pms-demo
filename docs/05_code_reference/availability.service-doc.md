# AvailabilityService Documentation

About `availability.service.ts`
Bu dosya, müsaitlik blokları ile ilgili iş mantığını (business logic) yöneten servis katmanıdır. `services/` dizininde bulunur. Controller katmanından çağrılır ve veri tutarlılığını sağlamak için `mongoose` transaction yapısını kullanır.

## Fonksiyonlar

### About `createBlock(accountId, unitId, data)`
Belirtilen birim ve tarih aralığı için yeni bir müsaitlik bloğu oluşturur.

- **Amaç**: Birimin belirli tarihlerde rezerve edilmesini engellemek.
- **Parametreler**:
  - `accountId` (string): İşlemi yapan tenant ID.
  - `unitId` (string): Bloklanacak birim ID.
  - `data` (CreateAvailabilityBlockInput['body']):
    - `start_date` (Date): Başlangıç.
    - `end_date` (Date): Bitiş.
    - `reason` (string, optional): Bloklama nedeni.

- **Validasyonlar & Kontroller**:
  1. **Unit Ownership**: Birimin ilgili `accountId`'ye ait olup olmadığı kontrol edilir.
  2. **Reservation Conflict**: Belirtilen aralıkta iptal edilmemiş bir rezervasyon var mı? (`start < end` ve `end > start` mantığı ile).
  3. **Block Conflict**: Belirtilen aralıkta başka bir müsaitlik bloğu var mı?

- **Yan Etkiler**:
  - `AvailabilityBlock` koleksiyonuna yeni bir kayıt ekler.
  - İşlemler atomic olarak (transaction ile) gerçekleştirilir. Standalone MongoDB ortamlarında transaction hatası alınırsa, transaction'sız (retry) mekanizması devreye girer.

- **Hatalar**:
  - `NotFoundError`: Birim bulunamazsa veya hesaba ait değilse.
  - `ConflictError`: Seçilen tarih aralığında çakışan bir rezervasyon veya blok varsa.
