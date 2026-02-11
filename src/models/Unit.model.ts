import mongoose, { Schema, Document } from 'mongoose';

export interface IUnit extends Document {
    account_id: mongoose.Types.ObjectId;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const UnitSchema: Schema = new Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    name: { type: String, required: true },
}, {
    timestamps: true
});

// Index for fetching all units of an account (as per specs) - already using `index: true`, no need to use this section
// UnitSchema.index({ account_id: 1 });

export default mongoose.model<IUnit>('Unit', UnitSchema);
