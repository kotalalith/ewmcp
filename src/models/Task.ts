import mongoose, { Schema, Document } from 'mongoose';

interface ITaskComment {
  author: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

interface IChecklistItem {
  text: string;
  done: boolean;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  project?: mongoose.Types.ObjectId;
  assignee?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Review' | 'Cancelled';
  dueDate?: Date;
  // Extended enterprise fields
  startDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  comments?: ITaskComment[];
  checklist?: IChecklistItem[];
  attachments?: string[];
  tags?: string[];
  createdBy?: string;
  reviewStatus?: 'Pending Review' | 'Approved' | 'Changes Requested';
}

const TaskCommentSchema = new Schema({
  author: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const ChecklistSchema = new Schema({
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
}, { _id: false });

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  assignee: { type: String },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: { 
    type: String, 
    enum: ['Not Started', 'In Progress', 'Completed', 'Review', 'Cancelled'],
    default: 'Not Started'
  },
  dueDate: { type: Date },
  // Extended fields
  startDate: { type: Date },
  estimatedHours: { type: Number },
  actualHours: { type: Number },
  comments: { type: [TaskCommentSchema], default: [] },
  checklist: { type: [ChecklistSchema], default: [] },
  attachments: [{ type: String }],
  tags: [{ type: String }],
  createdBy: { type: String },
  reviewStatus: { type: String, enum: ['Pending Review', 'Approved', 'Changes Requested'] },
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
