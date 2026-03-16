export interface IJobPayload {
    jobType: string;
    params: any;
}

export interface IJobExecutor {
    execute(payload: any): Promise<void>;
}