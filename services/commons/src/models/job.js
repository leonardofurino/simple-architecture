"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobModel = exports.JobType = exports.JobStatus = void 0;
const mongoose_1 = require("mongoose");
var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "PENDING";
    JobStatus["PROCESSING"] = "PROCESSING";
    JobStatus["COMPLETED"] = "COMPLETED";
    JobStatus["FAILED"] = "FAILED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var JobType;
(function (JobType) {
    JobType["GENERIC"] = "Generic";
    JobType["HARD"] = "Hard";
    JobType["MEDIUM"] = "Medium";
    JobType["SOFT"] = "Soft";
})(JobType || (exports.JobType = JobType = {}));
const jobSchema = new mongoose_1.Schema({
    taskId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true },
    user: { type: String, required: true },
    status: { type: String, enum: Object.values(JobStatus), default: JobStatus.PENDING },
    type: { type: String, enum: Object.values(JobType), default: JobType.GENERIC },
    payload: { type: mongoose_1.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    result: { type: mongoose_1.Schema.Types.Mixed } // here Workers will write at the end
});
exports.JobModel = (0, mongoose_1.model)('Job', jobSchema);
