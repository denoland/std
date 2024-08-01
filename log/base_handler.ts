// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import {
  type FormatterFunction,
  Handler,
  type HandlerOptions,
} from "./handler.ts";

/**
 * @deprecated This will be removed in 1.0.0. Use {@linkcode FormatterFunction} instead.
 */
export type { FormatterFunction };

/**
 * @deprecated This will be removed in 1.0.0. Use {@linkcode Handler} instead.
 */
export const BaseHandler = Handler;

/**
 * @deprecated This will be removed in 1.0.0. Use {@linkcode HandlerOptions} instead.
 */
export type BaseHandlerOptions = HandlerOptions;
