// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

export interface LogLevel {
  name: string;
  code: number;
}

export const logLevels = {
  trace: { name: "Trace", code: 10 },
  debug: { name: "Debug", code: 20 },
  info: { name: "Info", code: 30 },
  warn: { name: "Warn", code: 40 },
  error: { name: "Error", code: 50 },
};
