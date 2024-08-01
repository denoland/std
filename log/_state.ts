// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Handler } from "./handler.ts";
import { DEFAULT_CONFIG } from "./_config.ts";
import type { Logger } from "./logger.ts";

export const state = {
  handlers: new Map<string, Handler>(),
  loggers: new Map<string, Logger>(),
  config: DEFAULT_CONFIG,
};
