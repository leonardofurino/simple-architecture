import { JobProducer } from './producer';
import { JobType } from '@simple-architecture/commons';
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
        process.env.AUTH_URL!,// Auth Service
        process.env.NOTIFICATION_URL!,  // Notification Service
        process.env.WEBSERVER_URL!, // Webserver 
    );

    try {
        // --- STEP 1: LOGIN ---
        console.log("🔑 Login attempt...");
        await producer.login();
        console.log("✅ Login OK!");

        // --- STEP 2: Notification (Socket.io) ---
        console.log("🔑 Notification subscription attempt...");
        await producer.connectNotifications();
        console.log("✅ Notification subscription OK!");

        // --- STEP 3: send task to webserver ---
        for (let i = 0; i < 10; i++) {
            console.log("Sending task %d ...", i);
            const taskId = await producer.submitTask(JobType.GENERIC, {
                imageUrl: 'https://example.com/photo.jpg',
                width: 800,
                height: 600
            });            
            console.log(`🎯 Task ${taskId} sent!`);
            console.debug("waiting for 2 sec...")
            await new Promise(res => setTimeout(res, 2000));
        }

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