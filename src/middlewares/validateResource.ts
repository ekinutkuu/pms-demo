import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validateResource = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (e: any) {
        if (e instanceof ZodError) {
            res.status(400).send({
                success: false,
                message: 'Validation failed',
                errors: e.issues,
            });
            return;
        }
        next(e);
    }
};
