import {AbstractExecutor} from '../../commons/base/AbstractExecutor';
import { JobType } from '../../commons/models/Job';

export class HardWorker extends AbstractExecutor {

    protected queue = JobType.HARD;

    public async execute(payload: any): Promise<void> {
        console.info('Executing ${queue} Job...');
        await new Promise(res => setTimeout(res, 4000));
        console.info('${queue} Job Executed!');
    }    

} 