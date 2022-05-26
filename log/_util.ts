export abstract class BaseLogger<D = unknown> {
  logLevel: number;
  quiet = false;
  constructor(logLevel: number) {
    this.logLevel = logLevel;
  }

  protected dispatch(data: D, logLevel: number) {
    if (this.quiet || this.logLevel > logLevel) return;
    this.handler(data, logLevel);
  }

  protected abstract handler(data: D, logLevel: number): void;
}
