import mongoose, { Schema, Document } from 'mongoose';

interface IMilestone {
  title: string;
  dueDate: Date;
  completed: boolean;
}

export interface IProject extends Document {
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status: 'Not Started' | 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  assignedTo?: mongoose.Types.ObjectId[];
  progress?: number;
  team?: string[];
  createdBy?: string;
  // Extended enterprise fields
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  budget?: number;
  budgetSpent?: number;
  tags?: string[];
  archived?: boolean;
  milestones?: IMilestone[];
  department?: string;
  clientName?: string;
}

const MilestoneSchema = new Schema({
  title: { type: String, required: true },
  dueDate: { type: Date, required: true },
  completed: { type: Boolean, default: false },
}, { _id: false });

const ProjectSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  status: { 
    type: String, 
    enum: ['Not Started', 'Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
    default: 'Planning'
  },
  assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  progress: { type: Number, default: 0 },
  team: [{ type: String }],
  createdBy: { type: String },
  // Extended fields
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  budget: { type: Number, default: 0 },
  budgetSpent: { type: Number, default: 0 },
  tags: [{ type: String }],
  archived: { type: Boolean, default: false },
  milestones: { type: [MilestoneSchema], default: [] },
  department: { type: String },
  clientName: { type: String },
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
