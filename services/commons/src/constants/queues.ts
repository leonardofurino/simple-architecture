export const QUEUES = {
  JOBS: 'jobs_queue',
  NOTIFICATIONS: 'notifications_queue',
  AUDIT: 'audit_log_queue'
} as const;

export const SOCKET_QUEUES = {
  NOTIFICATIONS: 'job_notification'
} as const;


export type QueueName = typeof QUEUES[keyof typeof QUEUES];
export type SocketQueueName = typeof SOCKET_QUEUES[keyof typeof SOCKET_QUEUES];