import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
  applicant: string; // email
  applicantName: string;
  type: 'Annual' | 'Sick' | 'Emergency' | 'Maternity' | 'Paternity' | 'Unpaid' | 'Other';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

const LeaveSchema: Schema = new Schema({
  applicant: { type: String, required: true },
  applicantName: { type: String, required: true },
  type: {
    type: String,
    enum: ['Annual', 'Sick', 'Emergency', 'Maternity', 'Paternity', 'Unpaid', 'Other'],
    default: 'Annual'
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
}, { timestamps: true });

export default mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);
