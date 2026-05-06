import {AbstractExecutor} from '@simple-architecture/commons';
import { JobType } from '@simple-architecture/commons';

export class MediumWorker extends AbstractExecutor {

    protected queue = JobType.MEDIUM;
    protected METRICS_PORT = Number(process.env.MEDIUM_METRICS_PORT);

    public async execute(payload: any): Promise<void> {
        console.info('Executing %s Job...', this.queue.toString());
        await new Promise(res => setTimeout(res, 3000));
        console.info('${queue} Job Executed!');
    }    

} 