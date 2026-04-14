import axios from 'axios';
import io from 'socket.io-client';
import { SOCKET_QUEUES, JobType } from '@simple-architecture/commons';
import { readFileSync } from "fs";

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
            auth: { token: this.token }, // Pass the token to handshake
            transports: ['websocket'],
            //  mTLS
            rejectUnauthorized: true, 
            secure: true,
            cert: readFileSync("./certs/client.crt", 'utf-8'),
            key: readFileSync("./certs/client.key", 'utf-8'),
            ca: readFileSync("./certs/ca.crt", 'utf-8')
        });

        this.socket.on("connect", () => {
            console.log("✅ Connected via mTLS! ID:", this.socket?.id);
        });

        this.socket.on("connect_error", (err: any) => {
            console.error("❌ mTLS Connection Error:", err.message);
        });

        this.socket.on(SOCKET_QUEUES.NOTIFICATIONS, (data: any) => {
            console.log(`[${this.user}] 🔔 Notification RECEIVED - Job ${data.taskId} , status: ${data.status}`);
        });
    }

    // 3) submit Task to Webserver
    async submitTask(jobType: JobType, payload: any) {
        if (!this.token) throw new Error("Token needed!");
        console.log(`Submit task to Webserver: jobType=${jobType}, payload=${payload}`);
        const res = await axios.post<TaskSubmitResponse>(`${this.webserverUrl}/task`, payload, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'x-job-type': jobType
            }
        });
        console.log(`[${this.user}] Task sent. ID: ${res.data.taskId}`);
        return res.data.taskId;
    }
}
