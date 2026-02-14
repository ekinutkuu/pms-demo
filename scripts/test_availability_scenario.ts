
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import Unit from '../src/models/Unit.model';
import AvailabilityBlock from '../src/models/AvailabilityBlock.model';
import Reservation from '../src/models/Reservation.model';
import Account from '../src/models/Account.model';
import { env } from '../src/config/env';

// Override MONGO_URI if needed, or use the one from env
const MONGO_URI = env.mongoUri || 'mongodb://localhost:27017/pms-task';

const log = (msg: string, type: 'INFO' | 'PASS' | 'FAIL' | 'WARN' = 'INFO') => {
    const icons = { INFO: 'ℹ️', PASS: '✅', FAIL: '❌', WARN: '⚠️' };
    console.log(`${icons[type]} [${type}] ${msg}`);
};

const runTest = async () => {
    // Suppress console.error and console.warn to keep test output clean
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    console.error = () => { };
    console.warn = () => { };

    let server: any;
    try {
        log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);

        // Setup Server
        const app = createApp();
        server = app.listen(0); // Listen on random port
        const port = (server.address() as any).port;
        const baseUrl = `http://localhost:${port}`;
        log(`Test Server running at ${baseUrl}`);

        // --- SETUP DATA ---
        // Create an Account
        const account = await Account.create({
            name: 'Stress Test Account',
            status: 'active'
        });
        const accountId = account._id;

        const otherAccount = await Account.create({
            name: 'Other Account',
            status: 'active'
        });
        const otherAccountId = otherAccount._id;

        const unit = await Unit.create({
            account_id: accountId,
            name: 'Stress Test Unit',
        });

        // Create a reservation to test conflicts
        // Ensure dates are future dates
        const reservationStart = new Date(Date.now() + 86400000 * 10); // +10 days
        const reservationEnd = new Date(Date.now() + 86400000 * 15);   // +15 days

        await Reservation.create({
            account_id: accountId,
            unit_id: unit._id,
            start_date: reservationStart,
            end_date: reservationEnd,
            status: 'confirmed',
            listing_source: 'DIRECT',
            // reservation_id is optional
        });

        const headers = {
            'Content-Type': 'application/json',
            'x-account-id': accountId.toString()
        };

        const postAvailability = async (start: Date, end: Date, accId = accountId) => {
            return fetch(`${baseUrl}/units/${unit._id}/availability/close`, {
                method: 'POST',
                headers: { ...headers, 'x-account-id': accId.toString() },
                body: JSON.stringify({
                    start_date: start.toISOString(),
                    end_date: end.toISOString(),
                    reason: 'Test Block'
                })
            });
        };

        // --- TEST SUITE ---

        // 1. Validation Tests
        log('\n--- 1. Validation Tests ---');

        // 1.1 Start > End
        let res = await postAvailability(new Date(Date.now() + 10000), new Date(Date.now()));
        if (res.status === 400) log('Start > End rejected correctly', 'PASS');
        else log(`Start > End failed. Status: ${res.status}`, 'FAIL');

        // 1.2 Past Date
        // Note: Check if system allows past blocks. Assuming strictly future or present validation in controller/schema.
        // If not strictly validated, this might pass (201). Adapting log based on response.
        res = await postAvailability(new Date(Date.now() - 100000), new Date(Date.now() - 10000));
        if (res.status === 400) log('Past start_date rejected correctly', 'PASS');
        else log(`Past start_date result: ${res.status}. (If allowed, this is OK)`, 'WARN');


        // 2. Multi-tenancy Tests
        log('\n--- 2. Multi-tenancy Tests ---');
        // Attempting to create availability for unit owned by accountId using otherAccountId
        // Should return 404 (Unit not found in scope) or 403 (Forbidden)
        res = await postAvailability(new Date(Date.now() + 86400000), new Date(Date.now() + 86400000 * 2), otherAccountId);
        if (res.status === 404 || res.status === 403) log('Access by other account rejected correctly', 'PASS');
        else log(`Access by other account failed. Expected 404/403, got ${res.status}`, 'FAIL');


        // 3. Conflict Tests (Reservation Overlap)
        log('\n--- 3. Conflict Tests (Reservation) ---');

        // 3.1 Exact Overlap
        res = await postAvailability(reservationStart, reservationEnd);
        if (res.status === 409) log('Exact reservation overlap rejected', 'PASS');
        else log(`Exact reservation overlap failed. Status: ${res.status}`, 'FAIL');

        // 3.2 Partial Overlap (Start inside)
        res = await postAvailability(new Date(reservationStart.getTime() + 86400000), new Date(reservationEnd.getTime() + 86400000));
        if (res.status === 409) log('Partial overlap (start inside) rejected', 'PASS');
        else log(`Partial overlap failed. Status: ${res.status}`, 'FAIL');

        // 3.3 Partial Overlap (End inside)
        res = await postAvailability(new Date(reservationStart.getTime() - 86400000), new Date(reservationStart.getTime() + 86400000));
        if (res.status === 409) log('Partial overlap (end inside) rejected', 'PASS');
        else log(`Partial overlap failed. Status: ${res.status}`, 'FAIL');


        // 4. Availability Block Overlap & Adjacency
        log('\n--- 4. Block Overlap & Adjacency ---');

        // Create a valid block: Days 20-22
        const blockStart = new Date(Date.now() + 86400000 * 20);
        const blockEnd = new Date(Date.now() + 86400000 * 22);
        res = await postAvailability(blockStart, blockEnd);
        if (res.status === 201) log('Base block created successfully', 'PASS');
        else {
            log(`Base block creation failed. Status: ${res.status}`, 'FAIL');
            const text = await res.text();
            console.log('Response:', text);
        }

        // 4.1 Overlap with existing block
        res = await postAvailability(new Date(blockStart.getTime() + 1000), blockEnd);
        if (res.status === 409) log('Overlap with existing block rejected', 'PASS');
        else log(`Overlap with block failed. Status: ${res.status}`, 'FAIL');

        // 4.2 Adjacent Block (Immediately after)
        const adjacentStart = blockEnd;
        const adjacentEnd = new Date(blockEnd.getTime() + 86400000);
        res = await postAvailability(adjacentStart, adjacentEnd);
        if (res.status === 201) log('Adjacent block (touching boundaries) accepted', 'PASS');
        else log(`Adjacent block failed. Status: ${res.status}`, 'FAIL');

        // CLEANUP
        log('\n--- Cleanup ---');
        await Unit.deleteOne({ _id: unit._id });
        await Reservation.deleteMany({ unit_id: unit._id });
        await AvailabilityBlock.deleteMany({ unit_id: unit._id });
        await Account.deleteOne({ _id: accountId });
        await Account.deleteOne({ _id: otherAccountId });

        if (server) server.close();
        await mongoose.disconnect();
        log('Done.');

    } catch (e: any) {
        // Restore console error to print the actual script error
        console.error = originalConsoleError;
        console.error('Test Error:', JSON.stringify(e, null, 2));
        if (e.errors) {
            console.error('Validation Errors:', JSON.stringify(e.errors, null, 2));
        }
        if (server) server.close();
        await mongoose.disconnect();
        process.exit(1);
    }
};

runTest();
