import axios from 'axios';
import io from 'socket.io-client';

interface AuthResponse {
    token: string;
}

interface TaskSubmitResponse {
    taskId: string;
}

export class JobProducer {
    private token?: string;
    private socket?: ReturnType<typeof io>;

    constructor(
        private user: string, 
        private tenantId: string,
        private authUrl = 'http://localhost:3002',
        private webserverUrl = 'http://localhost:3000',
        private notificationUrl = 'http://localhost:3001'
    ) {}

    // 1) Login
    async login() {
        const res = await axios.post<AuthResponse>(`${this.authUrl}/login`, {
            user: this.user,
            tenantId: this.tenantId,
            password: 'secret123'
        });
        this.token = res.data.token;
        console.log(`[${this.user}] ✅ Logged in. Token obtained.`);
    }

    // 2) subscribe to Notification Service
    connectNotifications() {
        if (!this.token) throw new Error("Devi fare il login prima!");

        this.socket = io(this.notificationUrl, {
            auth: { token: this.token } // Pass the token to handshake
        });

        this.socket.on('job_update', (data: any) => {
            console.log(`[${this.user}] 🔔 Notifica: Job ${data.taskId} è ${data.status}`);
        });
    }

    // 3) submit Task to Webserver
    async submitTask(jobType: string, payload: any) {
        if (!this.token) throw new Error("Token mancante!");

        const res = await axios.post<TaskSubmitResponse>(`${this.webserverUrl}/task`, payload, {
            headers: { 
                'Authorization': `Bearer ${this.token}`,
                'job-type': jobType 
            }
        });
        console.log(`[${this.user}] 📤 Task sent. ID: ${res.data.taskId}`);
        return res.data.taskId;
    }
}