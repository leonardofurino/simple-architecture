import Fastify from 'fastify';
import { Server } from 'socket.io';
import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { JobModel, JobStatus, JobMessage, JobType } from '@simple-architecture/commons';
import { AuthServiceUtils as AuthUtils } from '@simple-architecture/commons';
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
    try {
        // 1. get token from Authorization header
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Token missed or not valid!' });
        }

        const token = authHeader.split(' ')[1];

        // 2. token verification
        const decoded = AuthUtils.verifyToken(token);
        if (!decoded) {
            return reply.status(401).send({ error: 'Token missed or not valid' });
        }

        console.log("Mongoose connection state:", mongoose.connection.readyState);
        const taskId = uuidv4();
        const payload = request.body;

        const jobType = request.headers['x-job-type'] as string;

        const { tenantId, user } = decoded;

        // 1. Save on MongoDB with PENDING state
        const newJob = new JobModel({
            taskId,
            tenantId,
            user,
            payload,
            status: JobStatus.PENDING
        });
        await newJob.save();

        if (!(jobType.toUpperCase() in JobType)) {
            return reply.status(400).send({ error: "Missing 'job-type' header" });
        }
        const jobTypeEnum = JobType[jobType as keyof typeof JobType];
        const message = { taskId, tenantId, user, type: jobTypeEnum, payload } as JobMessage;

        // 2. Send to RabbitMQ
        const queue = jobType.toLowerCase();
        console.log("Sending to rabbitmq queue %s - message: %s", queue, message);

        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
            persistent: true
        });
        return { status: 'Accepted', taskId };
    } catch (err: unknown) {
        console.error(err);

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        return reply.status(500).send({
            error: 'Internal Server Error',
            details: errorMessage
        });
    }
});

const start = async () => {
    try {
        await initMongo();
        await initRabbit();
        const port = Number(process.env.WEBSERVER_PORT!);
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