import { BaseHandler } from "../handler.ts";
import { LogLevel } from "../levels.ts";

export class ConsoleHandler extends BaseHandler {
  log(msg: string) {
    console.log(msg);
  }
}
