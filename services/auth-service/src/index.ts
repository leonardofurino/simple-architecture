import Fastify from 'fastify';
import { AuthServiceUtils } from '@simple-architecture/commons';
import * as dotenv from 'dotenv';
import path from 'path';

const server = Fastify();

async function init() {
    const configInitResult = dotenv.config({ path: path.resolve(__dirname, '../../commons/.env') });
    if (configInitResult.error) {
        console.error("Error loading .env:", configInitResult.error);
        process.exit(1);
    }
    const AUTH_SERVER_PORT = Number(process.env.AUTH_SERVER_PORT);
    if (!AUTH_SERVER_PORT) {
        console.log("AUTH_SERVER_PORT: {}", AUTH_SERVER_PORT);
        throw new Error("Error loading .env AUTH_SERVER_PORT!");
    }
    server.listen({ port: AUTH_SERVER_PORT, host: '0.0.0.0' }, () => {
        console.log('🔐 Auth Service running on port {}',AUTH_SERVER_PORT);
    });
}

server.post('/login', async (request, reply) => {
    const { user, password, tenantId } = request.body as any;
    console.log("Received login request for user {}", user);
    // Simulating
    if (password === 'secret123') {
        const token = AuthServiceUtils.generateToken({ user, tenantId });
        console.log("Returning token {}", token);
        return { token };
    }

    return reply.status(401).send({ error: 'Unauthorized' });
});

init();

