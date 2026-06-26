import mongoose, { Schema, Document } from "mongoose";

export interface IMeeting extends Document {
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  attendees: string[];
  organizer: string;
}

const MeetingSchema = new Schema(
  {
    title: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String },
    type: { type: String, default: "Zoom" },
    attendees: { type: [String], default: [] },
    organizer: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Meeting || mongoose.model<IMeeting>("Meeting", MeetingSchema);
