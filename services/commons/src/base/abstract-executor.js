"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractExecutor = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const amqplib_1 = __importDefault(require("amqplib"));
const job_1 = require("../models/job");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const queues_1 = require("../constants/queues");
class AbstractExecutor {
    async init() {
        dotenv.config({ path: path_1.default.resolve(__dirname, '../../.env') });
    }
    async startWorker() {
        try {
            await this.init();
            // 2. Connection to MongoDB
            await mongoose_1.default.connect(process.env.MONGO_URL);
            console.log('✅ Worker connected to MongoDB');
            // 3. Connetti to RabbitMQ
            const connection = await amqplib_1.default.connect(process.env.RABBITMQ_URL);
            const channel = await connection.createChannel();
            const queue = this.queue.toString().toLowerCase();
            await channel.assertQueue(queue, { durable: true });
            channel.prefetch(1); // one at time
            console.log(`☑️ Worker waiting for messages from [${queue}]...`);
            channel.consume(queue, async (msg) => {
                if (msg !== null) {
                    const content = JSON.parse(msg.content.toString());
                    const { taskId, tenantId, user, type, payload } = content;
                    try {
                        console.log(`[${taskId}] Task received, it is processing ...`);
                        // execute the Job
                        await this.execute(payload);
                        // 4. works and update the db
                        await job_1.JobModel.findOneAndUpdate({ taskId }, { status: job_1.JobStatus.COMPLETED, type: type, payload: payload, updatedAt: new Date() });
                        const notification = {
                            taskId,
                            tenantId,
                            user,
                            status: job_1.JobStatus.COMPLETED,
                            message: `Job ${type} successfully completed!`
                        };
                        // Send notification
                        channel.sendToQueue(queues_1.QUEUES.NOTIFICATIONS, Buffer.from(JSON.stringify(notification)), { persistent: true });
                        console.log(`[${taskId}] ✅  Task completed!`);
                        channel.ack(msg);
                    }
                    catch (error) {
                        await job_1.JobModel.findOneAndUpdate({ taskId }, { status: job_1.JobStatus.FAILED, updatedAt: new Date() });
                        channel.nack(msg);
                    }
                }
            });
        }
        catch (error) {
            console.error('❌ Worker Error:', error);
        }
    }
}
exports.AbstractExecutor = AbstractExecutor;
