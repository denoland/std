import { LogLevel, logLevels } from "./levels.ts";

export function asString(data: unknown): string {
  if (typeof data === "string") {
    return data;
  } else if (
    data === null ||
    typeof data === "number" ||
    typeof data === "bigint" ||
    typeof data === "boolean" ||
    typeof data === "undefined" ||
    typeof data === "symbol"
  ) {
    return String(data);
  } else if (typeof data === "object") {
    return JSON.stringify(data);
  }
  return "undefined";
}

export abstract class Logger<
    M = unknown,
    A = unknown | undefined,
    L extends { [level: string]: LogLevel } = typeof logLevels,
> {
    constructor(public logLevel: L[keyof L]) {}

    dispatch(logLevel: L[keyof L], message: M, additionalData: A) {
        if (this.logLevel.code > logLevel.code) {
            return;
        }

        this.handle(logLevel, message, additionalData)
    }

    protected buildMessage(logLevel: L[keyof L], message: M, additionalData: A) {
        return `[${logLevel.name}] ${new Date().toLocaleDateString()} ${asString(message)}${additionalData ? ` ${asString(additionalData)}` : ''}}`
    }

    protected abstract handle(logLevel: L[keyof L], message: M, additionalData: A): void 
}
