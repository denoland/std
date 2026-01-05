// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { abortable } from "./abortable.ts";

/** Options for {@linkcode deadline}. */
export interface DeadlineOptions {
  /** Signal used to abort the deadline. */
  signal?: AbortSignal;
}

/**
 * Create a promise which will be rejected with {@linkcode DOMException} when
 * a given delay is exceeded.
 *
 * Note: Prefer to use {@linkcode AbortSignal.timeout} instead for the APIs
 * that accept {@linkcode AbortSignal}.
 *
 * @throws {TypeError} If `ms` is `NaN`.
 * @throws {DOMException & { name: "TimeoutError" }} If the provided duration
 * runs out before resolving.
 * @throws {DOMException & { name: "AbortError" }} If the optional signal is
 * aborted with the default `reason` before resolving or timing out.
 * @throws {AbortSignal["reason"]} If the optional signal is aborted with a
 * custom `reason` before resolving or timing out.
 * @typeParam T The type of the provided and returned promise.
 * @param p The promise to make rejectable.
 * @param ms Duration in milliseconds for when the promise should time out. If
 * greater than or equal to `Number.MAX_SAFE_INTEGER`, the deadline will never expire.
 * @param options Additional options.
 * @returns A promise that will reject if the provided duration runs out before resolving.
 *
 * @example Usage
 * ```ts ignore
 * import { deadline } from "@std/async/deadline";
 * import { delay } from "@std/async/delay";
 *
 * const delayedPromise = delay(1_000);
 * // Below throws `DOMException` after 10 ms
 * const result = await deadline(delayedPromise, 10);
 * ```
 */
export function deadline<T>(
  p: Promise<T>,
  ms: number,
  options: DeadlineOptions = {},
): Promise<T> {
  if (Number.isNaN(ms)) {
    throw new TypeError("Ms must be a number, received NaN");
  }

  const hasTimeout = ms < Number.MAX_SAFE_INTEGER;
  const hasSignal = options.signal !== undefined;

  if (!hasTimeout && !hasSignal) return p;

  if (hasTimeout && !hasSignal) {
    return abortable(p, AbortSignal.timeout(ms));
  }
  if (!hasTimeout && hasSignal) {
    return abortable(p, options.signal!);
  }

  return abortable(
    p,
    AbortSignal.any([
      AbortSignal.timeout(ms),
      options.signal!,
    ]),
  );
}
