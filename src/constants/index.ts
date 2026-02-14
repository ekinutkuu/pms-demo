export enum ReservationStatus {
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
}

export enum WebhookStatus {
    PROCESSED = 'processed',
    FAILED = 'failed',
}

export enum AccountStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum WebhookEventType {
    BOOKING_CREATED = 'booking_created'
}

export enum ListingSource {
    DIRECT = 'direct',
    AIRBNB = 'airbnb',
    BOOKING_COM = 'booking.com',
}

export enum AvailabilityBlockSource {
    OWNER_BLOCKED = 'ownerBlocked',
    MAINTENANCE = 'maintenance',
    RENOVATION = 'renovation',
}
