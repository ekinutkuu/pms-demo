import { Router } from 'express';
import * as availabilityController from '../controllers/availability.controller';
import { validateResource } from '../middlewares/validateResource';
import { accountScope } from '../middlewares/accountScope';
import { CreateAvailabilityBlockSchema, GetAvailabilitySchema } from '../schemas/availability.schema';

const router = Router();

// POST /units/:unitId/availability/close
router.post(
    '/:unitId/availability/close',
    accountScope,
    validateResource(CreateAvailabilityBlockSchema),
    availabilityController.createBlock as import('express').RequestHandler
);

// GET /units/:unitId/availability
router.get(
    '/:unitId/availability',
    accountScope,
    validateResource(GetAvailabilitySchema),
    availabilityController.getAvailability as import('express').RequestHandler
);

export default router;
