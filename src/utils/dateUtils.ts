import { z } from 'zod';

/**
 * ISO 8601 date veya datetime formatını doğrulayan regex.
 * Kabul edilen formatlar:
 *   - "2026-08-10" (date-only)
 *   - "2026-08-10T00:00:00Z" (datetime UTC)
 *   - "2026-08-10T00:00:00+03:00" (datetime with offset)
 *   - "2026-08-10T00:00:00.000Z" (datetime with millis)
 */
export const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

/**
 * ISO 8601 tarih veya datetime string'ini kabul edip Date'e dönüştüren Zod helper.
 * Hem "2026-08-10" hem "2026-08-10T00:00:00Z" formatlarını destekler.
 * Gevşek Date.parse yerine strict ISO 8601 regex kullanır.
 */
export const dateOrDatetime = (fieldName: string) =>
    z.string()
        .refine(val => ISO_8601_REGEX.test(val) && !isNaN(Date.parse(val)), {
            message: `Invalid ${fieldName} format (ISO 8601 date or datetime required)`
        })
        .transform(str => new Date(str));

export const getOverlapQuery = (startDate: Date, endDate: Date) => {
    return {
        start_date: { $lt: endDate },
        end_date: { $gt: startDate }
    };
};
