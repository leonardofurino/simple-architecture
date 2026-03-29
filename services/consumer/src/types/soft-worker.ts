import {AbstractExecutor} from '../../../commons/src/base/abstract-executor';
import { JobType } from '../../../commons/src/models/job';

export class SoftWorker extends AbstractExecutor {

    protected queue = JobType.SOFT;

    public async execute(payload: any): Promise<void> {
        console.info('Executing ${queue} Job...');
        await new Promise(res => setTimeout(res, 1000));
        console.info('${queue} Job Executed!');
    }    

} 