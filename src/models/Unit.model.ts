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

export default mongoose.model<IUnit>('Unit', UnitSchema);
