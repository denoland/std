// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// TODO(iuioiua): Add web-compatible declaration once TypeScript 5.5 is released
// and in the Deno runtime. See https://github.com/microsoft/TypeScript/pull/58211
//
// Note: this code is still compatible with recent
// web browsers. See https://caniuse.com/?search=AbortSignal.any

/**
 * Provide helpers with asynchronous tasks like {@linkcode delay | delays},
 * {@linkcode debounce | debouncing}, {@linkcode retry | retrying}, or
 * {@linkcode pooledMap | pooling}.
 *
 * ```ts no-assert
 * import { delay } from "@std/async/delay";
 *
 * await delay(100); // waits for 100 milliseconds
 * ```
 *
 * @module
 */

export * from "./abortable.ts";
export * from "./deadline.ts";
export * from "./debounce.ts";
export * from "./delay.ts";
export * from "./mux_async_iterator.ts";
export * from "./pool.ts";
export * from "./tee.ts";
export * from "./retry.ts";
