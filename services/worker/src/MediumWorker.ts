import {AbstractExecutor} from '../../commons/base/AbstractExecutor';
import { JobType } from '../../commons/models/Job';

export class MediumWorker extends AbstractExecutor {

    protected queue = JobType.MEDIUM;

    public async execute(payload: any): Promise<void> {
        console.info('Executing ${queue} Job...');
        await new Promise(res => setTimeout(res, 3000));
        console.info('${queue} Job Executed!');
    }    

} 