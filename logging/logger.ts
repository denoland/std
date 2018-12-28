import { LogLevel, getLevelByName, getLevelName } from "./levels.ts";
import { BaseHandler } from "./handler.ts";

export class Logger {
  level: number;
  levelName: string;
  handlers: any[];

  constructor(levelName: string, handlers?: BaseHandler[]) {
    this.level = getLevelByName(levelName);
    this.levelName = levelName;
    
    this.handlers = handlers || [];
  }

  _log(level, ...args) {
    if (this.level > level) return;
    this.handlers.forEach(handler => {
      handler.handle(level, ...args);
    });
  }

  debug(...args) {
    return this._log(LogLevel.DEBUG, ...args);
  }

  info(...args) {
    return this._log(LogLevel.INFO, ...args);
  }

  warning(...args) {
    return this._log(LogLevel.WARNING, ...args);
  }

  error(...args) {
    return this._log(LogLevel.ERROR, ...args);
  }

  critical(...args) {
    return this._log(LogLevel.CRITICAL, ...args);
  }
}
