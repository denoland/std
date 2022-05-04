import { BaseLogger } from "./_util.ts";

export const logLevels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

export abstract class Logger<D extends unknown[]> extends BaseLogger<D> {
  static logLevels = logLevels;

  trace(...data: D) {
    this.dispatch(data, logLevels.trace);
  }
  debug(...data: D) {
    this.dispatch(data, logLevels.debug);
  }
  info(...data: D) {
    this.dispatch(data, logLevels.info);
  }
  warn(...data: D) {
    this.dispatch(data, logLevels.warn);
  }
  error(...data: D) {
    this.dispatch(data, logLevels.error);
  }

  protected abstract handler(data: D, logLevel: number): void;
}
