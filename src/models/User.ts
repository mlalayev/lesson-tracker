import mongoose, { Schema, models, model } from 'mongoose';

export interface IUser {
  _id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'], default: 'EMPLOYEE' },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

export const User = models.User || model<IUser>('User', UserSchema);


