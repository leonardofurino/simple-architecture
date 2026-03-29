import { GenericWorker } from "./types/generic-worker";
import { SoftWorker } from "./types/soft-worker";
import { MediumWorker } from "./types/medium-worker";
import { HardWorker } from "./types/hard-worker";

async function bootstrap() {
    new GenericWorker().startWorker();
//    new SoftWorker().startWorker();
//    new MediumWorker().startWorker();
//    new HardWorker().startWorker();

}

bootstrap();