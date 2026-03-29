import Fastify from 'fastify';
import { AuthServiceUtils } from '@simple-architecture/commons';

const server = Fastify();

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

server.listen({ port: 3002, host: '0.0.0.0' }, () => {
    console.log('🔐 Auth Service running on port 3002');
});