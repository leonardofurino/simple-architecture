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
        private tenantId: string,
        private user: string,    
        private password: string,    
        private authUrl : string,
        private notificationUrl : string,
        private webserverUrl : string
    ) { }

    // 1) Login
    async login() {
        console.log("login on url:", `${this.authUrl}/login`);
        const res = await axios.post<AuthResponse>(`${this.authUrl}/login`, {
            user: this.user,
            tenantId: this.tenantId,
            password: this.password,
        });
        this.token = res.data.token;
        console.log(`[${this.user}] ✅ Logged in. Token obtained.`);
    }

    // 2) subscribe to Notification Service
    async connectNotifications() {
        if (!this.token) throw new Error("Login is needed!");

        this.socket = io(this.notificationUrl, {
            auth: { token: this.token } // Pass the token to handshake
        });

        this.socket.on('job_update', (data: any) => {
            console.log(`[${this.user}] 🔔 Notification: Job ${data.taskId} è ${data.status}`);
        });
    }

    // 3) submit Task to Webserver
    async submitTask(jobType: string, payload: any) {
        if (!this.token) throw new Error("Token needed!");

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
