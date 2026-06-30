import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  type: 'Company' | 'Department' | 'Team' | 'General';
  department?: string;
  pinned: boolean;
  priority: 'Low' | 'Medium' | 'High';
  createdBy: string;
  createdByName: string;
  expiresAt?: Date;
  attachments?: string[];
}

const AnnouncementSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['Company', 'Department', 'Team', 'General'],
    default: 'Company'
  },
  department: { type: String },
  pinned: { type: Boolean, default: false },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  createdBy: { type: String, required: true },
  createdByName: { type: String, required: true },
  expiresAt: { type: Date },
  attachments: [{ type: String }],
}, { timestamps: true });

export default mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
