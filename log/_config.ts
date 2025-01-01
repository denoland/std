// Copyright 2018-2025 the Deno authors. MIT license.

import { ConsoleHandler } from "./console_handler.ts";
import type { LogConfig } from "./logger.ts";

export const DEFAULT_LEVEL = "INFO";

export const DEFAULT_CONFIG: LogConfig = {
  handlers: {
    default: new ConsoleHandler(DEFAULT_LEVEL),
  },

  loggers: {
    default: {
      level: DEFAULT_LEVEL,
      handlers: ["default"],
    },
  },
};
