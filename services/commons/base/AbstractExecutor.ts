import mongoose from 'mongoose';
import amqp from 'amqplib';
import { JobMessage, JobModel, JobStatus, JobType } from '../models/Job';
import { IJobExecutor } from '../types/Job';
import * as dotenv from 'dotenv';
import path from 'path';



export abstract class AbstractExecutor implements IJobExecutor {

    public abstract execute(payload: any): Promise<void>;

    protected abstract queue: JobType;

    private async init() {
    dotenv.config({ path: path.resolve(__dirname, '../../../services/commons/.env') });

    } 
    public async startWorker() {
        try {
            await this.init();

            // 2. Connection to MongoDB
            await mongoose.connect(process.env.MONGO_URL!);
            console.log('✅ Worker connected to MongoDB');

            // 3. Connetti to RabbitMQ
            const connection = await amqp.connect(process.env.RABBITMQ_URL!);
            const channel = await connection.createChannel();
            const queue = this.queue.toString().toLowerCase();

            await channel.assertQueue(queue, { durable: true });
            channel.prefetch(1); // one at time

            console.log(`☑️ Worker waiting for messages from [${queue}]...`);

            channel.consume(queue, async (msg) => {
                if (msg !== null) {
                    const content = JSON.parse(msg.content.toString()) as JobMessage;
                    const { taskId, type, payload } = content;
                    try {
                        console.log(`[${taskId}] Task received, it is processing ...`);
                        // execute the Job
                        await this.execute(payload);
                        // 4. works and update the db
                        await JobModel.findOneAndUpdate(
                            { taskId },
                            { status: JobStatus.COMPLETED, type: type, payload: payload, updatedAt: new Date() }
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
