import amqp from 'amqplib';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { AuthServiceUtils, JwtPayload } from '../../commons/src/utils/auth-utils'
import * as dotenv from 'dotenv';
import path from 'path';

async function init() {
    dotenv.config({ path: path.resolve(__dirname, '../../../services/commons/.env') });
}
const PORT = Number(process.env.NOTIFICATION_SERVER_PORT);
const TTL = Number(process.env.REDIS_TTL);

async function startNotificationService() {
    await init();
    const io = new Server(PORT);
    const redis = createClient({ url: process.env.REDIS_URL! });
    await redis.connect();

    const conn = await amqp.connect(process.env.RABBIT_URL!);
    const channel = await conn.createChannel();
    const queue = 'job_completed';

    await channel.assertQueue(queue, { durable: true });

    // 1. wait for job completion from workers
    channel.consume(queue, async (msg) => {
        if (!msg) return;

        const { taskId, tenantId, status } = JSON.parse(msg.content.toString());

        // 2. check if is there a connected client of tenantId
        const room = io.sockets.adapter.rooms.get(tenantId);
        const isOnline = room && room.size > 0;

        if (isOnline) {
            // send result via WebSocket
            io.to(tenantId).emit("job_update", { taskId, status });
            console.log(`[Real-time] Notificato tenant: ${tenantId}`);
        } else {
            // BUFFERING su Redis
            const key = `notifications:buffer:${tenantId}`;
            await redis.rPush(key, JSON.stringify({ taskId, status, ts: Date.now() }));
            await redis.expire(key, TTL);
            console.log(`[Buffer] Tenant ${tenantId} offline. Salvato su Redis.`);
        }

        channel.ack(msg);
    });

    // 3. restore old lost notifications
    io.on("connection", (socket) => {
        socket.on("join-tenant", async (tenantId) => {
            socket.join(tenantId);
            const pending = await redis.lRange(`pending_refs:${tenantId}`, 0, -1);
            if (pending.length > 0) {
                pending.forEach(n => socket.emit("notification", JSON.parse(n)));

                // empty list after delivery
                await redis.del(`pending_refs:${tenantId}`);
                console.log(`Delivered ${pending.length} old lost notifications for tenant ${tenantId}`);
            }
        });
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        try {
            // signature verification
            const decoded: JwtPayload = AuthServiceUtils.verifyToken(token);

            // valid token ...
            socket.data.tenantId = decoded.tenantId;
            socket.data.user = decoded.user;
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid or expired token"));
        }
    });
}

await startNotificationService();