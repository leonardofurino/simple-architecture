import amqp from 'amqplib';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { AuthServiceUtils, JwtPayload } from '@simple-architecture/commons';
import { Notification } from '@simple-architecture/commons';
import { QUEUES } from '@simple-architecture/commons';
import { SOCKET_QUEUES } from '@simple-architecture/commons';
import * as dotenv from 'dotenv';
import path from 'path';
import { readFileSync } from "fs";
import { createServer } from "https";

async function init() {
    const configInitResult = dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    if (configInitResult.error) {
        console.error("Error loading .env:", configInitResult.error);
        process.exit(1);
    }
}


async function startNotificationService() {
    await init();
    const PORT = Number(process.env.NOTIFICATION_SERVER_PORT);
    const TTL = Number(process.env.REDIS_TTL);
    if (!PORT || !TTL) {
        console.log("PORT: {}", PORT);
        console.log("TTL: {}", TTL);
        throw new Error("Error loading .env PORT or TTL!");
    }

    const httpsOptions = {
        key: readFileSync('./certs/server.key'),
        cert: readFileSync('./certs/server.crt'),
        ca: readFileSync('./certs/ca.crt'),
        requestCert: true,
        rejectUnauthorized: true
    };
    const httpServer = createServer(httpsOptions);

    const io = new Server(httpServer, {
        cors: {
            origin: "*",
        }
    });

    httpServer.listen(PORT, "0.0.0.0", () => {
        console.log("🚀 Secure Notification Server running on port %s (mTLS)", PORT);
    });

    const redis = createClient({ url: process.env.REDIS_URL! });
    await redis.connect();

    const conn = await amqp.connect(process.env.RABBIT_URL!);
    const channel = await conn.createChannel();

    await channel.assertQueue(QUEUES.NOTIFICATIONS, { durable: true });

    // 1. wait for job completion from workers
    channel.consume(QUEUES.NOTIFICATIONS, async (msg) => {
        if (!msg) return;
        const notification = JSON.parse(msg.content.toString()) as Notification;
        const tenantId = notification.tenantId;
        const taskId = notification.taskId;
        const status = notification.status;
        console.log("Received notification %s from worker on queue %s", notification, QUEUES.NOTIFICATIONS);

        // 2. check if is there a connected client of tenantId
        const room = io.sockets.adapter.rooms.get(tenantId);
        const isOnline = room && room.size > 0;

        if (isOnline) {
            // send result via WebSocket
            io.to(tenantId).emit(SOCKET_QUEUES.NOTIFICATIONS, notification);
            console.log(`[Real-time] Notified tenant: ${tenantId} with notification: ${JSON.stringify(notification)}`);
        } else {
            // BUFFERING su Redis
            const key = `notifications:buffer:${tenantId}`;
            await redis.rPush(key, JSON.stringify({ taskId, status, ts: Date.now() }));
            await redis.expire(key, TTL);
            console.log(`[Buffer] Tenant ${tenantId} offline. stored su Redis.`);
        }

        channel.ack(msg);
    });


    io.use((socket, next) => {
        // mTLS
        const clientCert = (socket.conn.request as any).client.getPeerCertificate();
        console.log(`[mTLS] Received connection from: ${clientCert.subject.CN}`);

        const token = socket.handshake.auth.token;

        try {
            // signature verification
            const decoded: JwtPayload = AuthServiceUtils.verifyToken(token);
            console.debug("decoded token: ", decoded);
            // valid token ...
            socket.data.tenantId = decoded.tenantId;
            socket.data.user = decoded.user;
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid or expired token"));
        }
    });

    io.on("connection", async (socket) => {
        console.log("[Socket] Secure connection established with mTLS");

        const tenantId = socket.data.tenantId;
        socket.join(tenantId);
        console.log(`[Socket] Tenant ${tenantId} connected and listening...`);
        // 3. restore old lost notifications
        const pending = await redis.lRange(`pending_refs:${tenantId}`, 0, -1);
        if (pending.length > 0) {
            pending.forEach(n => socket.emit("notification", JSON.parse(n)));

            // empty list after delivery
            await redis.del(`pending_refs:${tenantId}`);
            console.log(`Delivered ${pending.length} old lost notifications for tenant ${tenantId}`);
        }
    });

}

startNotificationService();