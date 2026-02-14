import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// .env dosyasını yükle
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Modelleri İçe Aktar (Model register edilmesi için)
import '../models/Account.model';
import '../models/Unit.model';

const Account = mongoose.model('Account');
const Unit = mongoose.model('Unit');

// --- CONFIGURATION ---
const CONFIG = {
    BASE_URL: `http://localhost:${process.env.PORT || 3000}`,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/pms-task',
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'test-secret',
};

// Renkli loglama için yardımcı fonksiyonlar
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
            name: 'Demo Test Account',
            status: 'active',
            settings: { demo: true }
        });
        createdAccountId = account._id.toString();
        log.success(`Test Account oluşturuldu: ${createdAccountId}`);

        // 2. Test Unit Oluştur
        const unit = await Unit.create({
            account_id: createdAccountId,
            name: 'Demo Test Unit'
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


// --- API FUNCTIONS ---

async function checkAvailability() {
    if (!createdUnitId || !createdAccountId) return;

    log.header('1. Müsaitlik Sorgulama Testi');

    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const url = `${CONFIG.BASE_URL}/units/${createdUnitId}/availability?start_date=${startDate}&end_date=${endDate}`;
    log.info(`İstek gönderiliyor: GET ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-account-id': createdAccountId,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            log.success(`Status: ${response.status}`);
            console.log('Response Data Sample:', JSON.stringify(data.data, null, 2));
        } else {
            log.error(`Status: ${response.status} - ${JSON.stringify(data)}`);
        }
    } catch (error) {
        log.error(`Bağlantı hatası: ${error}`);
        log.warn('Sunucunun (npm run dev) çalışıp çalışmadığını kontrol edin.');
    }
}

async function closeAvailability() {
    if (!createdUnitId || !createdAccountId) return;

    log.header('2. Müsaitlik Kapama (Bloklama) Testi');

    const startDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString();

    const body = {
        start_date: startDate,
        end_date: endDate,
        source: 'ownerBlocked' // 'maintenance', 'renovation' etc.
    };

    const url = `${CONFIG.BASE_URL}/units/${createdUnitId}/availability/close`;
    log.info(`İstek gönderiliyor: POST ${url}`);
    console.log('Body:', JSON.stringify(body, null, 2));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-account-id': createdAccountId,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            log.success(`Status: ${response.status}`);
            log.success(`Blok oluşturuldu: ${JSON.stringify(data)}`);
        } else {
            // Eğer çakışma varsa (409) bunu da başarılı bir test sonucu olarak kabul edebiliriz (Validation çalışıyor demektir)
            if (response.status === 409) {
                log.warn(`Çakışma algılandı (Beklenen davranış olabilir): ${JSON.stringify(data)}`);
            } else {
                log.error(`Status: ${response.status} - ${JSON.stringify(data)}`);
            }
        }
    } catch (error) {
        log.error(`Bağlantı hatası: ${error}`);
    }
}

async function triggerWebhook() {
    if (!createdUnitId || !createdAccountId) return;

    log.header('3. Webhook (Rezervasyon) Testi');

    const timestamp = Date.now();
    const payload = {
        event_id: `evt_${Math.floor(Math.random() * 100000)}`,
        type: 'booking_created',
        account_id: createdAccountId,
        data: {
            reservation_id: `res_${Math.floor(Math.random() * 100000)}`,
            unit_id: createdUnitId,
            check_in: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            check_out: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
            source: 'booking.com',
        }
    };

    // RAW Body string olarak
    const rawBody = JSON.stringify(payload);

    // İmza Hesaplama: timestamp.rawBody
    const signaturePayload = `${timestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha256', CONFIG.WEBHOOK_SECRET);
    const signature = hmac.update(signaturePayload).digest('hex');

    const url = `${CONFIG.BASE_URL}/webhooks/bookings`;
    log.info(`İstek gönderiliyor: POST ${url}`);
    log.info(`Signature: ${signature}`);

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

        const data = await response.json();

        if (response.ok) {
            log.success(`Status: ${response.status}`);
            log.success(`Webhook işlendi: ${JSON.stringify(data)}`);
        } else {
            log.error(`Status: ${response.status} - ${JSON.stringify(data)}`);
        }
    } catch (error) {
        log.error(`Bağlantı hatası: ${error}`);
    }
}

// --- MAIN ---

async function runTests() {
    console.clear();
    log.header('API TEST SCRIPT BAŞLATILIYOR (OTOMATİK DB MODU)');

    await setupDatabase();

    if (createdAccountId && createdUnitId) {
        await checkAvailability();
        console.log('\n------------------------------------------------\n');
        await closeAvailability();
        console.log('\n------------------------------------------------\n');
        await triggerWebhook();
    } else {
        log.error('Test verileri oluşturulamadığı için testler atlandı.');
    }

    await cleanupDatabase();
    log.header('TESTLER TAMAMLANDI');
}

runTests().catch((err) => {
    console.error(err);
    cleanupDatabase();
});
