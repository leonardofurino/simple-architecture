import {AbstractExecutor} from '../../../commons/src/base/abstract-executor';
import { JobType } from '../../../commons/src/models/job';

export class HardWorker extends AbstractExecutor {

    protected queue = JobType.HARD;

    public async execute(payload: any): Promise<void> {
        console.info('Executing ${queue} Job...');
        await new Promise(res => setTimeout(res, 4000));
        console.info('${queue} Job Executed!');
    }    

} 