import {AbstractExecutor} from '@simple-architecture/commons';
import { JobType } from '@simple-architecture/commons';

export class GenericWorker extends AbstractExecutor {

    protected queue = JobType.GENERIC;
    protected METRICS_PORT = Number(process.env.GENERIC_METRICS_PORT);


    public async execute(payload: any): Promise<void> {
        console.info('Executing %s Job...', this.queue.toString());
        await new Promise(res => setTimeout(res, 2000));
        console.info('%s Job Executed!', this.queue.toString());
    }    

} 