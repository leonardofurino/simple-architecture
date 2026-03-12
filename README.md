# Resilient Distributed Job Orchestrator
A polyglot, self-healing asynchronous task processing system built with TypeScript and Python. This project demonstrates advanced architectural patterns: Event-Driven Microservices, Dynamic Backpressure, and Real-time Observability.

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
