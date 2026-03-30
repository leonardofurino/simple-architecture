![Simple Architecture Logo](/assets/img/simpleArchitectureLogo.png) 


# Resilient Distributed Job Orchestrator
A self-healing asynchronous task processing system built with TypeScript and Python. This project uses some architectural patterns: Event-Driven Microservices, Dynamic Backpressure, and Real-time Observability.

## Architectural Overview
The system manages a full task lifecycle—from a simulated user request to real-time notification—while constantly monitoring infrastructure health and auto-adjusting processing speed to prevent system failure.

## System Diagram
The diagram illustrates the flow: Producer -> HAProxy -> Webserver -> RabbitMQ -> Consumer/Job Runner -> MongoDB -> Redis Status -> Regulator.

## Tech Stack
Reverse Proxy: HAProxy (Rate Limiting, TLS Termination, WebSocket support).

Web Layer: Node.js + TypeScript (Express, Socket.io).

Message Broker: RabbitMQ (Asynchronous Task Queuing).

Execution Engine: Python (Simulated Producers) & TypeScript (Multithreaded Consumers).

State & Persistence: MongoDB (Job Results), Redis (Desired State & Checkpointing).

Observability: Python (Resource Monitoring via psutil), Grafana (Real-time Dashboards).

Infrastructure: Docker & Docker Compose.

## Key Engineering Highlights
1. Closed-Loop Feedback Control (Self-Healing)
The Regulator component acts as a "Controller Plane." It analyzes real-time CPU/RAM metrics from the Monitor. If a critical threshold is reached, the Regulator updates the Desired State in Redis, forcing Workers to:

Scale the number of active Worker Threads.

Inject a dynamic sleep interval into the execution loop (Active Backpressure).

2. Stateless Workers & Graceful Recovery
Every Job follows a specific interface that supports Checkpointing.

If a Worker is killed due to resource exhaustion, it intercepts the signal and saves its current progress to Redis.

Upon restart, the new Worker instance resumes the job exactly from the last saved state, ensuring Fault Tolerance.

3. Full Async Lifecycle & WebSockets
Non-blocking Request: The Producer sends an HTTP POST.

Immediate ACK: The Webserver responds with a 202 Accepted and a unique task_id.

Real-time Notification: Once processing is complete, the Notification Service pushes an update to the Producer via WebSockets.


# Usage:
- rabbitmq, mongodb, redis, grafana
docker compose up -d

- start the auth service
cd services/auth
npm run build
npm run dev

- start the notification service
cd services/notification
npm run build
npm run dev

- start the web server
cd services/webserver
npm run build
npm run dev

- start the client (producer)
cd services/producer
npm run build
npm run dev

- start the consumer ( worker )
cd services/worker
npm run build
npm run dev

## FLOW DRAFT ( @TODO complete on the comunication diagram ):
producer login (using tenantId, user, password) 
=> auth server 
=> subscribe to notification service ( socket + redis )
=> submit task 
=> web server to consumer queue 
=> consumer task execution 
=> notify the notification service via rabbitmq 
=> notification service notify the client via redis + socket

## @TODO: 
1) tenants and users on db
2) producers like "real" users on browser
3) some unit tests ???
4) ha-proxy
5) ===> CONTROL PLANE:
    5.1) Performance Monitor
    5.2) Performance Controller
5) grafana
6) maybe smartphone app ( android) as client ???
