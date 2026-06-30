import mongoose, { Schema, Document } from 'mongoose';

interface ITicketComment {
  author: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface ITicket extends Document {
  ticketId: string;
  title: string;
  description: string;
  category: 'IT Support' | 'HR' | 'Finance' | 'Facilities' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  comments: ITicketComment[];
  resolvedAt?: Date;
}

const TicketCommentSchema = new Schema({
  author: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const TicketSchema: Schema = new Schema({
  ticketId: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['IT Support', 'HR', 'Finance', 'Facilities', 'Other'],
    default: 'Other'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'],
    default: 'Open'
  },
  createdBy: { type: String, required: true },
  createdByName: { type: String, required: true },
  assignedTo: { type: String },
  assignedToName: { type: String },
  comments: { type: [TicketCommentSchema], default: [] },
  resolvedAt: { type: Date },
}, { timestamps: true });

TicketSchema.pre('save', async function() {
  if (!this.ticketId) {
    const count = await mongoose.models.Ticket.countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(4, '0')}`;
  }
});

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
