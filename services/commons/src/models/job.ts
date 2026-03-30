import { Schema, model } from 'mongoose';

export enum JobStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum JobType {
    GENERIC = 'Generic',
    HARD = 'Hard',
    MEDIUM = 'Medium',
    SOFT = 'Soft'
}

export interface JobMessage {
  taskId: string;
  tenantId: string;
  user: string; 
  type: JobType,
  payload: any;
}

export interface Notification {
  taskId: string;
  tenantId: string;
  user: string; 
  status: JobStatus,
  message: string;
}

const jobSchema = new Schema({
    taskId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true},
    user: { type: String, required: true},
    status: { type: String, enum: Object.values(JobStatus), default: JobStatus.PENDING },
    type: { type: String, enum: Object.values(JobType), default: JobType.GENERIC},
    payload: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    result: { type: Schema.Types.Mixed } // here Workers will write at the end
});

export const JobModel = model('Job', jobSchema);
