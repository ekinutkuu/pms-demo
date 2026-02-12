# DateUtils Documentation

About `dateUtils.ts`
Bu dosya, tarih işlemleri ve tarih bazlı sorgu oluşturma yardımcılarını içerir. `utils/` dizininde bulunur.

## Fonksiyonlar

### About `getOverlapQuery(startDate, endDate)`
İki tarih aralığının çakışıp çakışmadığını kontrol etmek için standart MongoDB sorgu nesnesini döndürür.

- **Amaç**: Overlap mantığını (StartA < EndB && EndA > StartB) tek bir yerde toplayarak kod tekrarını önlemek.
- **Parametreler**:
  - `startDate` (Date): Kontrol edilecek aralığın başlangıcı.
  - `endDate` (Date): Kontrol edilecek aralığın bitişi.
- **Dönüş Değeri**:
  - `{ start_date: { $lt: endDate }, end_date: { $gt: startDate } }`
