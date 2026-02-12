export class BaseError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NotFoundError extends BaseError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

export class ValidationError extends BaseError {
    constructor(message = 'Validation failed') {
        super(message, 400);
    }
}

export class ConflictError extends BaseError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}

export class UnauthorizedError extends BaseError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
