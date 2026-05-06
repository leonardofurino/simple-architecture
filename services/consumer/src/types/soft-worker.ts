import {AbstractExecutor} from '@simple-architecture/commons';
import { JobType } from '@simple-architecture/commons';

export class SoftWorker extends AbstractExecutor {

    protected queue = JobType.SOFT;
    protected METRICS_PORT = Number(process.env.SOFT_METRICS_PORT);

    public async execute(payload: any): Promise<void> {
        console.info('Executing %s Job...', this.queue.toString());
        await new Promise(res => setTimeout(res, 1000));
        console.info('${queue} Job Executed!');
    }    

} 