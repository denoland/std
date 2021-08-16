// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

export class LogLevel {
  name: string;
  code: number;
  constructor(name: string, code: number) {
    this.name = name;
    this.code = code;
  }
}

export const logLevels = {
  trace: new LogLevel("Trace", 10),
  debug: new LogLevel("Debug", 20),
  info: new LogLevel("Info", 30),
  warn: new LogLevel("Warn", 40),
  error: new LogLevel("Error", 50),
};
