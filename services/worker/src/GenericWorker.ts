import {AbstractExecutor} from '../../commons/base/AbstractExecutor';
import { JobType } from '../../commons/models/Job';

export class GenericWorker extends AbstractExecutor {

    protected queue = JobType.GENERIC;

    public async execute(payload: any): Promise<void> {
        console.info('Executing %s Job...', this.queue.toString());
        await new Promise(res => setTimeout(res, 2000));
        console.info('%s Job Executed!', this.queue.toString());
    }    

} 