import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  recipient: string;
  type: string; // 'task_assigned', 'meeting_scheduled', 'mention'
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema(
  {
    recipient: { type: String, required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
