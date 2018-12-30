import { open, File } from "deno";
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

  log(msg: string) { }
  async setup() { }
  async destroy() { }
}


export class ConsoleHandler extends BaseHandler {
  log(msg: string) {
    console.log(msg);
  }
}


// TODO: abstract away as `WriterHandler` that requires
// subclasses to provide '_writer' field
export class FileHandler extends BaseHandler {
  private _file: File;
  private _filename: string;

  constructor(levelName: string, filename: string) {
    super(levelName);
    this._filename = filename;
  }

  log(msg: string) {
    const encoder = new TextEncoder();
    this._file.write(encoder.encode(msg));
  }

  async setup() {
    // open file in append mode - write only
    this._file = await open(this._filename, 'a');
  }

  async destroy() {
    await this._file.close();
  }
}