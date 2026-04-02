import {AbstractExecutor} from '@simple-architecture/commons';
import { JobType } from '@simple-architecture/commons';

export class MediumWorker extends AbstractExecutor {

    protected queue = JobType.MEDIUM;

    public async execute(payload: any): Promise<void> {
        console.info('Executing ${queue} Job...');
        await new Promise(res => setTimeout(res, 3000));
        console.info('${queue} Job Executed!');
    }    

} 