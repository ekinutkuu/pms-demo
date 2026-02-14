import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// .env dosyasını yükle
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Modelleri İçe Aktar (Model register edilmesi için)
import '../models/Account.model';
import '../models/Unit.model';

// Modelleri kullanmadan önce register edildiklerinden emin olalım
// (Normalde import ettiğimizde çalışır ama bazen race condition olabilir)
const Account = mongoose.model('Account');
const Unit = mongoose.model('Unit');

// --- CONFIGURATION ---
const CONFIG = {
    BASE_URL: `http://localhost:${process.env.PORT || 3000}`,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/pms-task',
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'test-secret',
    CONCURRENCY_LEVEL: 10
};

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
    magenta: '\x1b[35m'
};

const log = {
    info: (msg: string) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
    success: (msg: string) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    error: (msg: string) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    warn: (msg: string) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    header: (msg: string) => console.log(`\n${colors.bold}=== ${msg} ===${colors.reset}\n`),
    db: (msg: string) => console.log(`${colors.magenta}[DB]${colors.reset} ${msg}`)
};

// Global değişkenler
let createdAccountId: string | null = null;
let createdUnitId: string | null = null;

// --- DB FUNCTIONS ---

async function setupDatabase() {
    log.header('VERİTABANI HAZIRLIĞI');

    try {
        log.db(`MongoDB'ye bağlanılıyor: ${CONFIG.MONGO_URI}`);
        await mongoose.connect(CONFIG.MONGO_URI);
        log.success('Veritabanı bağlantısı başarılı.');

        // 1. Test Account Oluştur
        const account = await Account.create({
            name: 'Concurrency Test Account',
            status: 'active',
            settings: { demo: true }
        });
        createdAccountId = account._id.toString();
        log.success(`Test Account oluşturuldu: ${createdAccountId}`);

        // 2. Test Unit Oluştur
        const unit = await Unit.create({
            account_id: createdAccountId,
            name: 'Concurrency Test Unit'
        });
        createdUnitId = unit._id.toString();
        log.success(`Test Unit oluşturuldu: ${createdUnitId}`);

    } catch (error) {
        log.error(`Veritabanı hatası: ${error}`);
        process.exit(1);
    }
}

async function cleanupDatabase() {
    log.header('TEMİZLİK');

    if (!createdAccountId || !createdUnitId) {
        log.warn('Temizlenecek veri bulunamadı.');
        return;
    }

    try {
        await Unit.deleteOne({ _id: createdUnitId });
        log.success(`Unit silindi: ${createdUnitId}`);

        await Account.deleteOne({ _id: createdAccountId });
        log.success(`Account silindi: ${createdAccountId}`);

        await mongoose.disconnect();
        log.db('Veritabanı bağlantısı kapatıldı.');

    } catch (error) {
        log.error(`Temizlik sırasında hata: ${error}`);
    }
}


// --- API FUNCTION ---

async function sendBookingRequest(index: number, checkIn: string, checkOut: string) {
    const timestamp = Date.now();
    const payload = {
        event_id: `evt_concurrent_${index}_${timestamp}`,
        type: 'booking_created',
        account_id: createdAccountId,
        data: {
            reservation_id: `res_concurrent_${index}_${timestamp}`,
            unit_id: createdUnitId,
            check_in: checkIn,
            check_out: checkOut,
            source: 'booking.com',
        }
    };

    // İmzayı hesapla
    const rawBody = JSON.stringify(payload);
    const signaturePayload = `${timestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha256', CONFIG.WEBHOOK_SECRET);
    const signature = hmac.update(signaturePayload).digest('hex');

    const url = `${CONFIG.BASE_URL}/webhooks/bookings`;

    const startTime = Date.now();

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-signature': signature,
                'x-webhook-timestamp': timestamp.toString()
            },
            body: rawBody
        });

        const duration = Date.now() - startTime;
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = { error: 'Invalid JSON response' };
        }

        return {
            index,
            status: response.status,
            duration,
            data
        };
    } catch (error) {
        return {
            index,
            status: 0, // Network error
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

// --- MAIN TEST FLOW ---

async function runConcurrencyTest() {
    log.header(`CONCURRENCY TEST (Level: ${CONFIG.CONCURRENCY_LEVEL})`);

    // Gelecekte bir tarih seçelim (çakışma olmaması için uzak bir tarih)
    const checkIn = new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString();
    const checkOut = new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString();

    log.info(`Test Tarihleri: ${checkIn} - ${checkOut}`);
    log.info(`${CONFIG.CONCURRENCY_LEVEL} adet istek AYNI ANDA gönderiliyor...`);

    const promises = [];
    for (let i = 0; i < CONFIG.CONCURRENCY_LEVEL; i++) {
        promises.push(sendBookingRequest(i + 1, checkIn, checkOut));
    }

    // İstekleri paralel başlat ve hepsinin bitmesini bekle
    const results = await Promise.all(promises);

    log.header('SONUÇLAR');

    let successCount = 0;
    let conflictCount = 0;
    let otherErrorCount = 0;

    for (const result of results) {
        const { index, status, duration, data, error } = result;

        if (status === 201 || status === 200) {
            successCount++;
            log.success(`[Req ${index}] DONE (${duration}ms) - Rezervasyon başarılı. ID: ${data?.data?.reservation_id || '?'}`);
        } else if (status === 409) {
            conflictCount++;
            log.warn(`[Req ${index}] CONFLICT (${duration}ms) - Çakışma yakalandı. Msg: ${data?.error || 'Conflict'}`);
        } else {
            otherErrorCount++;
            log.error(`[Req ${index}] ERROR (${duration}ms) - Status: ${status}. Msg: ${JSON.stringify(data || error)}`);
        }
    }

    log.header('ÖZET RAPOR');
    console.log(`Toplam İstek Sayısı : ${CONFIG.CONCURRENCY_LEVEL}`);
    console.log(`Başarılı (Booking)  : ${successCount}`);
    console.log(`Engellenen (Conflict): ${conflictCount}`);
    console.log(`Diğer Hatalar       : ${otherErrorCount}`);

    console.log('\n--- DEĞERLENDİRME ---');
    if (successCount === 1 && conflictCount === CONFIG.CONCURRENCY_LEVEL - 1) {
        log.success('MÜKEMMEL: Sistem race condition durumunu başarıyla yönetti. Sadece 1 rezervasyon oluştu, diğerleri reddedildi.');
    } else if (successCount > 1) {
        log.error(`KRİTİK HATA: Race condition oluştu! ${successCount} adet rezervasyon aynı anda kabul edildi (Double Booking).`);
    } else if (successCount === 0) {
        log.error('HATA: Hiçbir rezervasyon oluşturulamadı. Sistemde başka bir sorun olabilir.');
    } else {
        log.warn('SONUÇ: Beklenmeyen bir dağılım oluştu. Logları inceleyin.');
    }
}

async function main() {
    await setupDatabase();

    if (createdAccountId && createdUnitId) {
        await runConcurrencyTest();
    }

    await cleanupDatabase();
}

main().catch((err) => {
    console.error(err);
    // Hata durumunda da temizlik yapmaya çalış
    cleanupDatabase().catch(() => { });
});
