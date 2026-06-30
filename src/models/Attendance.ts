import mongoose, { Schema, Document } from 'mongoose';

interface IBreak {
  start: Date;
  end?: Date;
}

export interface IAttendance extends Document {
  userId: string; // email
  userName: string;
  date: string; // YYYY-MM-DD
  clockIn?: Date;
  clockOut?: Date;
  breaks: IBreak[];
  totalHours?: number;
  status: 'Present' | 'Absent' | 'Half Day' | 'On Leave' | 'Holiday';
  notes?: string;
}

const BreakSchema = new Schema({
  start: { type: Date, required: true },
  end: { type: Date },
}, { _id: false });

const AttendanceSchema: Schema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  date: { type: String, required: true },
  clockIn: { type: Date },
  clockOut: { type: Date },
  breaks: { type: [BreakSchema], default: [] },
  totalHours: { type: Number },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day', 'On Leave', 'Holiday'],
    default: 'Absent'
  },
  notes: { type: String },
}, { timestamps: true });

// Compound index to ensure one record per user per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
