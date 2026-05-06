import {AbstractExecutor} from '@simple-architecture/commons';
import { JobType } from '@simple-architecture/commons';

export class HardWorker extends AbstractExecutor {

    protected queue = JobType.HARD;
    protected METRICS_PORT = Number(process.env.HARD_METRICS_PORT);

    public async execute(payload: any): Promise<void> {
        console.info('Executing %s Job...', this.queue.toString());
        await new Promise(res => setTimeout(res, 4000));
        console.info('${queue} Job Executed!');
    }    

} 