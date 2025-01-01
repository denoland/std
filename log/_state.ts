// Copyright 2018-2025 the Deno authors. MIT license.

import type { BaseHandler } from "./base_handler.ts";
import { DEFAULT_CONFIG } from "./_config.ts";
import type { Logger } from "./logger.ts";

export const state = {
  handlers: new Map<string, BaseHandler>(),
  loggers: new Map<string, Logger>(),
  config: DEFAULT_CONFIG,
};
