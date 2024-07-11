// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// TODO(iuioiua): Add web-compatible declaration once TypeScript 5.5 is released
// and in the Deno runtime. See https://github.com/microsoft/TypeScript/pull/58211
//
// Note: this code is still compatible with recent
// web browsers. See https://caniuse.com/?search=AbortSignal.any
import { abortable } from "./abortable.ts";

/** Options for {@linkcode deadline}. */
export interface DeadlineOptions {
  /**
   * Signal used to abort the deadline.
   */
  signal?: AbortSignal;
}

/**
 * Create a promise which will be rejected with {@linkcode DOMException} when
 * a given delay is exceeded.
 *
 * Note: Prefer to use {@linkcode AbortSignal.timeout} instead for the APIs
 * that accept {@linkcode AbortSignal}.
 *
 * @throws {DOMException} When the provided duration runs out before resolving
 * or if the optional signal is aborted, and `signal.reason` is undefined.
 * @typeParam T The type of the provided and returned promise.
 * @param p The promise to make rejectable.
 * @param ms Duration in milliseconds for when the promise should time out.
 * @param options Additional options.
 * @returns A promise that will reject if the provided duration runs out before resolving.
 *
 * @example Usage
 * ```ts no-eval
 * import { deadline } from "@std/async/deadline";
 * import { delay } from "@std/async/delay";
 *
 * const delayedPromise = delay(1_000);
 * // Below throws `DOMException` after 10 ms
 * const result = await deadline(delayedPromise, 10);
 * ```
 */
export async function deadline<T>(
  p: Promise<T>,
  ms: number,
  options: DeadlineOptions = {},
): Promise<T> {
  const signals = [AbortSignal.timeout(ms)];
  if (options.signal) signals.push(options.signal);
  return await abortable(p, AbortSignal.any(signals));
}
