import { Response, NextFunction } from 'express';
import { ScopedRequest } from '../types/common.types';
import { CreateAvailabilityBlockInput, GetAvailabilityInput } from '../schemas/availability.schema';
import * as availabilityService from '../services/availability.service';

export const createBlock = async (
    req: ScopedRequest & { body: CreateAvailabilityBlockInput['body'], params: CreateAvailabilityBlockInput['params'] },
    res: Response,
    next: NextFunction
) => {
    try {
        const { unitId } = req.params;
        const accountId = req.context.accountId;
        const block = await availabilityService.createBlock(accountId, unitId, req.body);

        res.status(201).json({
            success: true,
            data: block
        });
    } catch (error) {
        next(error);
    }
};

export const getAvailability = async (
    req: ScopedRequest & { query: GetAvailabilityInput['query'], params: GetAvailabilityInput['params'] },
    res: Response,
    next: NextFunction
) => {
    try {
        const { unitId } = req.params;
        const accountId = req.context.accountId;
        const availability = await availabilityService.getAvailability(accountId, unitId, req.query);

        res.status(200).json({
            success: true,
            data: availability
        });
    } catch (error) {
        next(error);
    }
};
