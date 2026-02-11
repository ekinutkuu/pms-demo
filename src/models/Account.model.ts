import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount extends Document {
    name: string;
    status: 'active' | 'inactive';
    settings?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const AccountSchema: Schema = new Schema({
    name: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    settings: { type: Object },
}, {
    timestamps: true
});

export default mongoose.model<IAccount>('Account', AccountSchema);
