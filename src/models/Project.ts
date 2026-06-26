import mongoose, { Schema, Document } from 'mongoose';

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
}

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
  createdBy: { type: String }
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
