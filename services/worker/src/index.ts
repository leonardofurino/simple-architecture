import { GenericWorker } from "./GenericWorker";
import { SoftWorker } from "./SoftWorker";
import { MediumWorker } from "./MediumWorker";
import { HardWorker } from "./HardWorker";

async function bootstrap() {
    new GenericWorker().startWorker();
//    new SoftWorker().startWorker();
//    new MediumWorker().startWorker();
//    new HardWorker().startWorker();

}

bootstrap();