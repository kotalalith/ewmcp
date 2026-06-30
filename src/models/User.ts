import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'Administrator' | 'Manager' | 'Team Lead' | 'Employee' | 'Client';
  status: 'Active' | 'Inactive';
  // Extended enterprise fields
  department?: string;
  designation?: string;
  phone?: string;
  avatar?: string;
  employeeId?: string;
  joiningDate?: Date;
  salary?: number;
  reportingTo?: string; // email of manager
  skills?: string[];
  bio?: string;
  // Leave balance
  annualLeaveBalance?: number;
  sickLeaveBalance?: number;
  // Password reset
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
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
  // Enterprise extensions
  department: { type: String },
  designation: { type: String },
  phone: { type: String },
  avatar: { type: String },
  employeeId: { type: String },
  joiningDate: { type: Date },
  salary: { type: Number },
  reportingTo: { type: String },
  skills: [{ type: String }],
  bio: { type: String },
  annualLeaveBalance: { type: Number, default: 21 },
  sickLeaveBalance: { type: Number, default: 10 },
  // Password reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
