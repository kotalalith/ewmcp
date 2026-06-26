import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  project?: mongoose.Types.ObjectId;
  assignee?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Not Started' | 'In Progress' | 'Completed';
  dueDate?: Date;
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  project: { type: Schema.Types.ObjectId, ref: 'Project' }, // Optional
  assignee: { type: String }, // Change to match frontend string
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: { 
    type: String, 
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started'
  },
  dueDate: { type: Date }
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
