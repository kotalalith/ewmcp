import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  head?: string; // email of department head
  headName?: string;
  members: string[]; // emails
  color?: string;
  budget?: number;
}

const DepartmentSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  head: { type: String },
  headName: { type: String },
  members: [{ type: String }],
  color: { type: String, default: '#3b82f6' },
  budget: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
