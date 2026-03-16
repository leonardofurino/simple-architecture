import Fastify from 'fastify';
import { Server } from 'socket.io';
import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { JobModel, JobStatus, JobMessage, JobType } from '../../commons/models/Job';
import * as dotenv from 'dotenv';
import path from 'path';

const fastify = Fastify({ logger: { transport: { target: 'pino-pretty' } } });
const envPath = path.resolve(__dirname, '../../../services/commons/.env');
dotenv.config({ path: envPath });

let channel: amqp.Channel;

// RabbitMQ connection
async function initRabbit() {
    const connection = await amqp.connect(process.env.RABBIT_URL!);
    channel = await connection.createChannel();
    await channel.assertQueue('task_queue', { durable: true });
}

async function initMongo() {
    const mongoUrl = process.env.MONGO_URL!;
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');
}

// Endpoint to receive Jobs
fastify.post('/task', async (request, reply) => {
    console.log("Mongoose connection state:", mongoose.connection.readyState);
    const taskId = uuidv4();
    const payload = request.body;

    const jobType = request.headers['job-type'] as string;

    // 1. Save on MongoDB with PENDING state
    const newJob = new JobModel({
        taskId,
        payload,
        status: JobStatus.PENDING
    });
    await newJob.save();

    if (!(jobType.toUpperCase() in JobType)) {
        return reply.status(400).send({ error: "Missing 'job-type' header" });
    }
    const jobTypeEnum = JobType[jobType as keyof typeof JobType];
    const message = { taskId, type: jobTypeEnum, payload } as JobMessage;

    // 2. Send to RabbitMQ
    channel.sendToQueue(jobType, Buffer.from(JSON.stringify(message)), {
        persistent: true
    });

    return { status: 'Accepted', taskId };
});

const start = async () => {
    try {
        await initMongo();
        await initRabbit();
        const port = Number(process.env.PORT) || 3001;
        const address = await fastify.listen({ port: port, host: '0.0.0.0' });

        // Setup Socket.io
        const io = new Server(fastify.server);
        io.on('connection', (socket) => {
            console.log('Producer connected via WS:', socket.id);
        });

        console.log(`Webserver listening on ${address}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();