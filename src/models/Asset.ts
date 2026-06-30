import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset extends Document {
  name: string;
  type: 'Laptop' | 'Mobile' | 'Monitor' | 'Accessory' | 'Other';
  serialNumber: string;
  assignedTo?: string; // email of employee
  assignedToName?: string;
  status: 'Allocated' | 'Available' | 'Under Repair' | 'Retired';
  allocatedDate?: Date;
  returnDate?: Date;
  notes?: string;
}

const AssetSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['Laptop', 'Mobile', 'Monitor', 'Accessory', 'Other'],
    default: 'Laptop'
  },
  serialNumber: { type: String, required: true, unique: true },
  assignedTo: { type: String },
  assignedToName: { type: String },
  status: {
    type: String,
    enum: ['Allocated', 'Available', 'Under Repair', 'Retired'],
    default: 'Available'
  },
  allocatedDate: { type: Date },
  returnDate: { type: Date },
  notes: { type: String },
}, { timestamps: true });

export default mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);
