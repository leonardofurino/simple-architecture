import { JobProducer } from './producer';
import * as dotenv from 'dotenv';
import path from 'path';

async function init() {
    const configInitResult = dotenv.config({ path: path.resolve(__dirname, '../../commons/.env') });
    if (configInitResult.error) {
        console.error("Error loading .env:", configInitResult.error);
        process.exit(1);
    }
}

async function startClient() {
    await init();
    console.log("🚀 Start Test Client...");

    const AUTH_URL = process.env.AUTH_URL;
    const NOTIFICATION_URL = process.env.NOTIFICATION_URL;
    const WEBSERVER_URL = process.env.WEBSERVER_URL;

    console.log("AUTH_URL: %s, NOTIFICATION_URL: %s, WEBSERVER_URL: %s", AUTH_URL, NOTIFICATION_URL, WEBSERVER_URL);
    if (!AUTH_URL || !NOTIFICATION_URL || !WEBSERVER_URL) {        
        throw new Error("Error loading .env URL params!");
    }

    // 1. init producer for a specific tenant and user
    const producer = new JobProducer(
        'tenant_alpha',   // tenantId
        'leonardo_dev',   // user
        'secret123', // password        
        process.env.AUTH_URL! ,// Auth Service
        process.env.NOTIFICATION_URL!,  // Notification Service
        process.env.WEBSERVER_URL!, // Webserver 
    );

    try {
        // --- STEP 1: LOGIN ---
        console.log("🔑 Tentativo di login...");
        await producer.login();
        console.log("✅ Login effettuato con successo!");

        // --- STEP 2: Notification (Socket.io) ---
        producer.connectNotifications();

        // --- STEP 3: send task to webserver ---
        console.log("Sending task...");
        const taskId = await producer.submitTask('image_resize', {
            imageUrl: 'https://example.com/photo.jpg',
            width: 800,
            height: 600
        });

        console.log(`🎯 Task ${taskId} sent!`);

    } catch (error: any) {
        console.error("❌ Ops! Something went wrong:");
        if (error.response) {
            console.error(`Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else {
            console.error(error.message);
        }
    }
}

startClient();