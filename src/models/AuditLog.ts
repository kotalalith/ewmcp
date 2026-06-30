import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'Success' | 'Failed' | 'Warning';
}

const AuditLogSchema: Schema = new Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true }, // e.g. 'LOGIN', 'CREATE_PROJECT', 'DELETE_USER'
  resource: { type: String, required: true }, // e.g. 'User', 'Project', 'Task'
  resourceId: { type: String },
  details: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: {
    type: String,
    enum: ['Success', 'Failed', 'Warning'],
    default: 'Success'
  },
}, { timestamps: true });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
