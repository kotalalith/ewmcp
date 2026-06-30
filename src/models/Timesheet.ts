import mongoose, { Schema, Document } from 'mongoose';

interface ITimesheetEntry {
  date: string; // YYYY-MM-DD
  project: string;
  task: string;
  hours: number;
  description: string;
}

export interface ITimesheet extends Document {
  userId: string; // email
  userName: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string;   // YYYY-MM-DD (Sunday)
  entries: ITimesheetEntry[];
  totalHours: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
}

const TimesheetEntrySchema = new Schema({
  date: { type: String, required: true },
  project: { type: String, default: 'General' },
  task: { type: String, default: '' },
  hours: { type: Number, required: true, min: 0, max: 24 },
  description: { type: String, default: '' },
}, { _id: false });

const TimesheetSchema: Schema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  weekStart: { type: String, required: true },
  weekEnd: { type: String, required: true },
  entries: { type: [TimesheetEntrySchema], default: [] },
  totalHours: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Approved', 'Rejected'],
    default: 'Draft'
  },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

TimesheetSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export default mongoose.models.Timesheet || mongoose.model<ITimesheet>('Timesheet', TimesheetSchema);
