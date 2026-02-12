import mongoose, { Schema, Document } from 'mongoose';

import { WebhookStatus } from '../constants';

export interface IWebhookEvent extends Document {
    account_id: mongoose.Types.ObjectId;
    event_id: string;
    event_type: string;
    payload: Record<string, any>;
    processed_at: Date;
    status: WebhookStatus;
    createdAt: Date;
    updatedAt: Date;
}

const WebhookEventSchema: Schema = new Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    event_id: { type: String, required: true },
    event_type: { type: String, required: true },
    payload: { type: Object, required: true },
    processed_at: { type: Date, default: Date.now },
    status: { type: String, enum: Object.values(WebhookStatus), default: WebhookStatus.PROCESSED },
}, {
    timestamps: true
});

// Critical Unique Index for Idempotency
WebhookEventSchema.index({ account_id: 1, event_id: 1 }, { unique: true });

export default mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
