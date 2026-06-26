import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'Administrator' | 'Manager' | 'Team Lead' | 'Employee' | 'Client';
  status: 'Active' | 'Inactive';
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OAuth or Mock login
  role: { 
    type: String, 
    required: true, 
    enum: ['Administrator', 'Manager', 'Team Lead', 'Employee', 'Client'],
    default: 'Employee'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
