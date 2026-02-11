import mongoose, { Schema, Document } from 'mongoose';

export interface IReservation extends Document {
    account_id: mongoose.Types.ObjectId;
    unit_id: mongoose.Types.ObjectId;
    start_date: Date;
    end_date: Date;
    status: 'confirmed' | 'cancelled';
    listing_source: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReservationSchema: Schema = new Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    unit_id: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    listing_source: { type: String, required: true },
}, {
    timestamps: true
});

// Critical Compound Index for Overlap Queries (ESR Rule)
ReservationSchema.index({ account_id: 1, unit_id: 1, start_date: 1, end_date: 1 });

export default mongoose.model<IReservation>('Reservation', ReservationSchema);
