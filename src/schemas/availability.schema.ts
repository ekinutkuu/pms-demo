import { z } from 'zod';

export const CreateAvailabilityBlockSchema = z.object({
    body: z.object({
        start_date: z.string().datetime().transform((str) => new Date(str)),
        end_date: z.string().datetime().transform((str) => new Date(str)),
        reason: z.string().optional(),
    }).refine((data) => data.end_date > data.start_date, {
        message: "End date must be after start date",
        path: ["end_date"],
    }).refine((data) => data.start_date >= new Date(), {
        message: "Start date must be in the future",
        path: ["start_date"],
    }),
    params: z.object({
        unitId: z.string().min(1, "Unit ID is required"),
    }),
});

export type CreateAvailabilityBlockInput = z.infer<typeof CreateAvailabilityBlockSchema>;
