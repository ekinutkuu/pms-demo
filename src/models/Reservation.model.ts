import mongoose, { Schema, Document } from 'mongoose';

import { ReservationStatus } from '../constants';

export interface IReservation extends Document {
    account_id: mongoose.Types.ObjectId;
    unit_id: mongoose.Types.ObjectId;
    start_date: Date;
    end_date: Date;
    status: ReservationStatus;
    listing_source: string;
    reservation_id?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReservationSchema: Schema = new Schema({
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
    status: { type: String, enum: Object.values(ReservationStatus), default: ReservationStatus.CONFIRMED },
    listing_source: { type: String, required: true },
    reservation_id: { type: String },
}, {
    timestamps: true
});

// Critical Compound Index for Overlap Queries (ESR Rule)
ReservationSchema.index({ account_id: 1, unit_id: 1, start_date: 1, end_date: 1 });

export default mongoose.model<IReservation>('Reservation', ReservationSchema);
