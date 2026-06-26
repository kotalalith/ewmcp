import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  channel: string;
  sender: string;
  senderName: string;
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema(
  {
    channel: { type: String, required: true },
    sender: { type: String, required: true },
    senderName: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
