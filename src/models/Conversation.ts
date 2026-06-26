import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  type: "direct" | "channel";
  name?: string;
  participants: string[]; // Store emails of participants
  createdAt: Date;
}

const ConversationSchema = new Schema(
  {
    type: { type: String, enum: ["direct", "channel"], required: true },
    name: { type: String }, // Only required for channels
    participants: [{ type: String, required: true }],
  },
  { timestamps: true }
);

export default mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", ConversationSchema);
