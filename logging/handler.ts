import { getLevelByName } from "./levels.ts";
import { LogRecord } from "./logger.ts";

export class BaseHandler {
  level: number;
  levelName: string;

  constructor(levelName: string) {
    this.level = getLevelByName(levelName);
    this.levelName = levelName;
  }

  handle(logRecord: LogRecord) {
    if (this.level > logRecord.level) return;
    
    // TODO: implement formatter
    const msg = `${logRecord.levelName} ${logRecord.msg}`;
    
    return this.log(msg);
  }

  log(msg: string) {}
  async setup() { }
  async destroy() { }
}
