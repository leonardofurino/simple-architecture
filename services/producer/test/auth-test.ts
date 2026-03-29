import { JobProducer } from '../src/producer';

async function testAuthFlow() {
    console.log("🧪 Inizio Test Integrazione: Auth Service");
    
    // 1. Istance for Tenant A
    const clientA = new JobProducer('leo_admin', 'tenant_gold');
    
    // 2. Istance for Tenant B 
    const clientB = new JobProducer('mario_user', 'tenant_silver');

    try {
        console.log("\n--- Tentative Login Client A ---");
        await clientA.login();
        

        console.log("\n--- Tentative Login Client B ---");
        await clientB.login();

        console.log("\n✅ Test Success!: Both clients have obtained a valid JWT.");    

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