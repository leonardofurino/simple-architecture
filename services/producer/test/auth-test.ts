import { JobProducer } from '../src/producer';
import * as dotenv from 'dotenv';
import path from 'path';

async function init() {
    const configInitResult = dotenv.config({ path: path.resolve(__dirname, '../../commons/.env') });
    if (configInitResult.error) {
        console.error("Error loading .env:", configInitResult.error);
        process.exit(1);
    }
}

async function testAuthFlow() {
    await init();
    console.log("🧪 Start integration test: Auth Service");
    const AUTH_URL = process.env.AUTH_URL;
    const NOTIFICATION_URL = process.env.NOTIFICATION_URL;
    const WEBSERVER_URL = process.env.WEBSERVER_URL;

    console.log("AUTH_URL: %s, NOTIFICATION_URL: %s, WEBSERVER_URL: %s", AUTH_URL, NOTIFICATION_URL, WEBSERVER_URL);
    if (!AUTH_URL || !NOTIFICATION_URL || !WEBSERVER_URL) {        
        throw new Error("Error loading .env URL params!");
    }
    
    // 1. Istance for Tenant A
    const clientA = new JobProducer('tenant_gold', 'leo_admin', 'secret123',  process.env.AUTH_URL! ,// Auth Service
        process.env.NOTIFICATION_URL!,  // Notification Service
        process.env.WEBSERVER_URL!); // Webserver 
    
    // 2. Istance for Tenant B 
    const clientB = new JobProducer('tenant_silver', 'mario_user', 'secret123',  process.env.AUTH_URL! ,// Auth Service
        process.env.NOTIFICATION_URL!,  // Notification Service
        process.env.WEBSERVER_URL!); // Webserver 

    try {
        console.log("\n--- Tentative Login Client A ---");
        await clientA.login();
        

        console.log("\n--- Tentative Login Client B ---");
        await clientB.login();

        console.log("\n✅ Test Success!: Both clients have obtained a valid JWT.");
        
        // --- STEP 2: Notification (Socket.io) ---
        await clientA.connectNotifications();

        //await clientB.connectNotifications();

    } catch (error: any) {
        console.error("\n❌ Errore durante il test!");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Messaggio:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testAuthFlow();