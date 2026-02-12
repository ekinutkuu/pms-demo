import mongoose, { Schema, Document } from 'mongoose';

export interface IAvailabilityBlock extends Document {
    account_id: mongoose.Types.ObjectId;
    unit_id: mongoose.Types.ObjectId;
    start_date: Date;
    end_date: Date;
    reason?: string;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AvailabilityBlockSchema: Schema = new Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    unit_id: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    start_date: { type: Date, required: true },
    end_date: {
        type: Date,
        required: true,
        validate: {
            validator: function (this: any, value: Date) {
                return this.start_date ? value > this.start_date : true;
            },
            message: 'End date must be after start date'
        }
    },
    reason: { type: String },
    deletedAt: { type: Date },
}, {
    timestamps: true
});

// Index for overlap queries
AvailabilityBlockSchema.index({ account_id: 1, unit_id: 1, start_date: 1, end_date: 1 });

export default mongoose.model<IAvailabilityBlock>('AvailabilityBlock', AvailabilityBlockSchema);
