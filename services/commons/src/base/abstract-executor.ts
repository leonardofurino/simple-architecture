import mongoose from 'mongoose';
import amqp from 'amqplib';
import { JobMessage, JobModel, JobStatus, JobType } from '../models/job';
import { Notification } from '../models/job';
import { IJobExecutor } from '../types/job';
import * as dotenv from 'dotenv';
import path from 'path';
import { QUEUES } from '../constants/queues';

export abstract class AbstractExecutor implements IJobExecutor {

    public abstract execute(payload: any): Promise<void>;

    protected abstract queue: JobType;

    private async init() {
        const configInitResult = dotenv.config({ path: path.resolve(process.cwd(), '.env') });
        if (configInitResult.error) {
            console.error("Error loading .env:", configInitResult.error);
            process.exit(1);
        }
        if (!process.env.MONGO_URL || !process.env.RABBIT_URL) {
            throw new Error("❌ Missing vitals: MONGO_URL or RABBIT_URL are not defined!");
        }
    }
    public async startWorker() {
        try {
            await this.init();
            // 2. Connection to MongoDB
            await mongoose.connect(process.env.MONGO_URL!);
            console.log('✅ Worker connected to MongoDB');

            // 3. Connetion to RabbitMQ
            const connection = await amqp.connect(process.env.RABBIT_URL!);
            console.log('✅ Worker connected to RABBIT_URL');
            const channel = await connection.createChannel();
            const queue = this.queue.toString().toLowerCase();

            await channel.assertQueue(queue, { durable: true });
            channel.prefetch(1); // one at time

            console.log(`☑️ Worker waiting for messages from [${queue}]...`);

            channel.consume(queue, async (msg) => {
                if (msg !== null) {
                    const content = JSON.parse(msg.content.toString()) as JobMessage;
                    const { taskId, tenantId, user, type, payload } = content;
                    try {
                        console.log(`[${taskId}] Task received, it is processing ...`);
                        // execute the Job
                        await this.execute(payload);
                        // 4. works and update the db
                        await JobModel.findOneAndUpdate(
                            { taskId },
                            { status: JobStatus.COMPLETED, type: type, payload: payload, updatedAt: new Date() }
                        );

                        const notification: Notification = {
                            taskId,
                            tenantId,
                            user,
                            status: JobStatus.COMPLETED,
                            message: `Job ${type} successfully completed!`
                        };

                        // Send notification
                        console.log(`[${taskId}] Task notification sent to %s`, QUEUES.NOTIFICATIONS);
                        channel.sendToQueue(
                            QUEUES.NOTIFICATIONS,
                            Buffer.from(JSON.stringify(notification)),
                            { persistent: true }
                        );

                        console.log(`[${taskId}] ✅  Task completed!`);
                        channel.ack(msg);
                    }
                    catch (error) {
                        await JobModel.findOneAndUpdate(
                            { taskId },
                            { status: JobStatus.FAILED, updatedAt: new Date() }
                        );
                        channel.nack(msg);
                    }
                }
            });

        } catch (error) {
            console.error('❌ Worker Error:', error);

        }
    }
}
