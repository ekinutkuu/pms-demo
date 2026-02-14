import { z } from 'zod';

/**
 * ISO 8601 date or datetime validation regex.
 * Supports: date-only ("YYYY-MM-DD"), UTC, offsets, and milliseconds.
 */
export const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

/**
 * Zod helper that accepts ISO 8601 date/datetime strings and converts them to Date objects.
 * Uses strict regex validation instead of loose Date.parse.
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
