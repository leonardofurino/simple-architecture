import * as dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import amqp from 'amqplib';
import { JobModel, JobStatus } from '../../commons/models/Job';


dotenv.config({ path: path.resolve(__dirname, '../../../services/commons/.env') });

async function startWorker() {
    try {
        // 2. Connection to MongoDB
        await mongoose.connect(process.env.MONGO_URL!);
        console.log('✅ Worker connected to MongoDB');

        // 3. Connetti to RabbitMQ
        const connection = await amqp.connect(process.env.RABBITMQ_URL!);
        const channel = await connection.createChannel();
        const queue = 'task_queue';

        await channel.assertQueue(queue, { durable: true });
        channel.prefetch(1); // one at time

        console.log(`☑️ Worker waiting for messages from [${queue}]...`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                const { taskId } = content;

                console.log(`[${taskId}] Task received, it is processing ...`);

                // 4. works and update the db
                await JobModel.findOneAndUpdate(
                    { taskId },
                    { status: JobStatus.COMPLETED, updatedAt: new Date() }
                );

                console.log(`[${taskId}] ✅  Task completed!`);
                channel.ack(msg);
            }
        });

    } catch (error) {
        console.error('❌ Worker Error:', error);
    }
}

startWorker();