import { Logger } from "./logger.ts";

export class ConsoleLogger<D extends unknown[] = unknown[]> extends Logger<D> {
  protected handler(data: D, _logLevel?: number) {
    console.log(...data);
  }
}
