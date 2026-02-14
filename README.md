# PMS Backend Task

## 🎯 Proje Hakkında

Bu sistem, mülk sahiplerinin ve yöneticilerinin birimlerinin (daire, oda vb.) müsaitlik durumlarını yönetmelerine ve dış kaynaklardan (örneğin Airbnb, Booking.com veya doğrudan rezervasyonlar) gelen rezervasyonları işlemelerine olanak tanır. Bu proje PMS sistemi için yüzeysel bir demo task işlevi görür, bütün fonksiyonlar/servisleri bulundurmaz.

**Temel Özellikler:**
*   **Müsaitlik Yönetimi:** Belirli tarih aralıklarını manuel olarak kapatma (bloklama).
*   **Rezervasyon Entegrasyonu:** Webhook aracılığıyla gelen rezervasyonları işleme ve takvimi güncelleme.
*   **Çakışma Kontrolü:** Tarih aralıklarının çakışmasını ve tekrar eden rezervasyonları önleme.
*   **Çoklu Kiracı (Multi-tenancy):** `account_id` bazlı veri izolasyonu ve erişim kontrolü.

## 🛠️ Teknolojiler

*   **Runtime:** Node.js
*   **Dil:** TypeScript
*   **Framework:** Express.js
*   **Veritabanı:** MongoDB (Mongoose ile)
*   **Validasyon:** Zod
*   **Test:** Jest & Supertest

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler
*   Node.js (v18+ önerilir)
*   MongoDB (Yerel veya Atlas URI)

#### MongoDB Replica Set Kurulumu (Local)
Transaction (oturum) yapısının çalışabilmesi için MongoDB'nin **Replica Set** modunda çalışması gerekir:
*Transaction yapısı "Double Booking Prevention" için kullanılır.

1.  Mevcut MongoDB servisini veya işlemini durdurun. (Yönetici yetkili PowerShell'de `net stop MongoDB` komutunu çalıştırın)
2.  `mongod` servisini `--replSet` bayrağı ile başlatın (ilgili konumda klasör mevcut olmalı):
    ```powershell
    mongod --replSet rs0 --dbpath "C:\mongodb\pms-demo"
    ```
3.  Ayrı bir terminalde, mongo shell (`mongosh`) ile bağlanın ve seti başlatın:
    ```javascript
    rs.initiate()
    ```
4.  Komut satırı imlecinin `rs0:PRIMARY>` olarak değiştiğini görmelisiniz.

### Code Environment

1.  **Depoyu klonlayın ve bağımlılıkları yükleyin:**
    ```bash
    npm install
    ```

2.  **Çevresel değişkenleri ayarlayın:**
    `.env.example` dosyasını `.env` olarak kopyalayın ve gerekli alanları doldurun (örneğin MongoDB URI).
    ```bash
    cp .env.example .env
    ```

3.  **Geliştirme sunucusunu başlatın:**
    Bu komut, kod değişikliklerini izleyen `ts-node-dev` ile sunucuyu başlatır.
    ```bash
    npm run dev
    ```

4.  **Projeyi derleyin (Production için):**
    ```bash
    npm run build
    npm start
    ```

## 🧠 Mantık ve Validasyon Kuralları

Sistem aşağıdaki kritik mantık kurallarını uygular:

### 1. Eşzamanlılık ve Çakışma Yönetimi (Concurrency Handling)

Aynı birim için, çakışan tarihlerde **aynı anda** (concurrently) gelen rezervasyon isteklerinde:

*   **Sistem çifte rezervasyona (double booking) izin vermez.**
*   **Nasıl Çalışır?**
    *   MongoDB **Transaction** (oturum) yapısı kullanılır. İşlemlerden herhangi biri başarısız olursa tüm değişikliklerin geri alınmasını garanti eder.
    *   İşlem başlangıcında ilgili birim (Unit) üzerinde **kilitleme (resource locking)** yapılır (`findByIdAndUpdate`).
    *   Bu sayede aynı birim için gelen istekler **sıraya sokulur (serialized)**. İlk istek işlenirken, ikinci istek bekler.
    *   İlk istek tamamlandığında, ikinci istek için çakışma kontrolü yapılır. (Çakışma kontrolü bir sonraki maddede detaylı bir şekilde anlatılmıştır.) Eğer çakışma yoksa, yeni rezervasyon veya blok kaydı oluşturulur.
    *   İşlem başarıyla tamamlanır ve kilit serbest bırakılır.

### 2. Çakışma Kontrolü (Conflict Detection)
İki tarih aralığının çakışıp çakışmadığı şu formül ile kontrol edilir:

```text
(Existing.start < New.end) AND (Existing.end > New.start)
```

Bu mantık kullanılarak sistem şunları **engeller**:
*   Çakışan rezervasyonlar (Overlapping reservations)
*   Kapalı/Bloklanmış tarihlere yapılan rezervasyonlar

Çakışma varsa conflict döner, çakışma yoksa yeni rezervasyon veya blok kaydı oluşturulur.

## 🔌 API Dokümantasyonu

Aşağıda temel API uç noktaları listelenmiştir.

### 1. Müsaitlik Sorgulama

Belirli bir birimin tarih aralığındaki müsaitlik durumunu getirir.

*   **Metot:** `GET`
*   **Uç Nokta:** `/units/:unitId/availability`
*   **Header:** `x-account-id: <account_id>`

**Örnek İstek (Query Parameters):**
```
?start_date=2024-01-01T00:00:00Z&end_date=2024-01-10T00:00:00Z
```

**Örnek Yanıt (200 OK):**
```json
{
  "data": [
    {
      "date": "2024-01-01",
      "status": "available"
    },
    {
      "date": "2024-01-02",
      "status": "blocked"
    }
  ]
}
```

### 2. Müsaitlik Kapama (Bloklama)

Bir birim için belirli bir tarih aralığını manuel olarak kapatır.

*   **Metot:** `POST`
*   **Uç Nokta:** `/units/:unitId/availability/close`
*   **Header:** `x-account-id: <account_id>`

**Örnek İstek Body:**
```json
{
  "start_date": "2024-06-01T12:00:00Z",
  "end_date": "2024-06-05T10:00:00Z",
  "source": "ownerBlocked"
}
```
*Not: `ownerBlocked` alanı opsiyoneldir, varsayılan değerler kullanılabilir.*

**Örnek Yanıt (201 Created):**
```json
{
  "message": "Availability block created successfully",
  "data": { ... }
}
```

## 🔁 Webhooks

Sistem, dış kaynaklardan gelen rezervasyon olaylarını dinlemek için bir webhook mekanizması kullanır.

### Rezervasyon Oluşturma

*   **Metot:** `POST`
*   **Uç Nokta:** `/webhooks/bookings`
*   **Header:** `x-webhook-signature: <imza>` (HMAC SHA256)

**Beklenen Payload:**

```json
{
  "event_id": "evt_123456",
  "type": "booking_created",
  "account_id": "acc_789",
  "data": {
    "reservation_id": "res_001",
    "unit_id": "u_123",
    "check_in": "2024-07-10T14:00:00Z",
    "check_out": "2024-07-15T11:00:00Z",
    "source": "booking.com" 
  }
}
```
*Not: Pozitif response olarak 201 (Başarılı) veya 200 (Zaten işlenmiş event) döner.

*   **Idempotency:** `event_id` kullanılarak aynı olayın birden fazla kez işlenmesi engellenir.
*   **Güvenlik:** Webhook imzası (`validateWebhookSignature` middleware) kontrol edilir. `account_id` ve `unit_id` eşleşmesi doğrulanır.

## 🧪 Testler

Proje `Jest` test framework'ü kullanılarak test edilmektedir.

*   **Testleri Çalıştır:**
    ```bash
    npm test
    ```
*   Testler hem birim (unit) hem de entegrasyon seviyesinde kontroller sağlar.

**API Tests:**
  ```bash
  npx ts-node src/scripts/api-test.ts
  ```

**Concurrency  Tests:**
  ```bash
  npx ts-node src/scripts/concurrency-test.ts
  ```

## 📡 HTTP Durum Kodları

API şu standart durum kodlarını kullanır:

*   `200 OK`: İşlem başarıyla gerçekleşti.
*   `201 Created`: Kaynak başarıyla oluşturuldu.
*   `400 Bad Request`: Geçersiz istek veya validasyon hatası (örn. yanlış tarih formatı).
*   `401 Unauthorized`: Kimlik doğrulama veya imza hatası.
*   `403 Forbidden`: Erişim yetkisi yok (örn. yanlış `account_id`).
*   `404 Not Found`: Kaynak bulunamadı (Birim veya rezervasyon yok).
*   `409 Conflict`: Çakışma (Örn. tarihlerde başka bir rezervasyon var).
*   `500 Internal Server Error`: Sunucu taraflı beklenmeyen hata.

## TODO:

Task kapsamında istenen bonus özelliklerden bazıları yapılmamıştır.

- Login / Logout logic with **JWT**
- **Unit tests** (Although some tests have been performed, other test structures still need to be implemented)
- **Rate limiting middleware**
