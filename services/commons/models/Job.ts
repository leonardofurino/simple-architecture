import { Schema, model } from 'mongoose';

export enum JobStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

const jobSchema = new Schema({
    taskId: { type: String, required: true, unique: true },
    status: { type: String, enum: Object.values(JobStatus), default: JobStatus.PENDING },
    payload: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    result: { type: Schema.Types.Mixed } // here Workers will write at the end
});

export const JobModel = model('Job', jobSchema);