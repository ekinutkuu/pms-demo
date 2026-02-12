import mongoose, { Schema, Document } from 'mongoose';

import { AccountStatus } from '../constants';

export interface IAccount extends Document {
    name: string;
    status: AccountStatus;
    settings?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const AccountSchema: Schema = new Schema({
    name: { type: String, required: true },
    status: { type: String, enum: Object.values(AccountStatus), default: AccountStatus.ACTIVE },
    settings: { type: Object },
}, {
    timestamps: true
});

export default mongoose.model<IAccount>('Account', AccountSchema);
