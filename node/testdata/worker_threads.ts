import {
  getEnvironmentData,
  isMainThread,
  parentPort,
  threadId,
  workerData,
} from "../worker_threads.ts";
import { once } from "../events.ts";

async function message(expectedMessage: string) {
  const [message] = await once(parentPort, "message");
  if (message !== expectedMessage) {
    console.log(`Expected the message "${expectedMessage}", but got`, message);
    // fail test
    parentPort.close();
  }
}

await message("Hello, how are you my thread?");
parentPort.postMessage("I'm fine!");

parentPort.postMessage({
  isMainThread,
  threadId,
  workerData: Array.isArray(workerData) &&
      workerData[workerData.length - 1] instanceof MessagePort
    ? workerData.slice(0, -1)
    : workerData,
  envData: [getEnvironmentData("test"), getEnvironmentData(1)],
});
