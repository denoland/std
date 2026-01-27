// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { delay } from "./delay.ts";

/** Options for {@linkcode poll}. */
export interface PollOptions {
  /** Signal used to abort the polling. */
  signal?: AbortSignal;
  /**
   * The interval in milliseconds between each poll.
   *
   * @default {1000}
   */
  interval?: number;
}

/**
 * Repeatedly calls a function until a condition is met, then returns the result.
 *
 * This is useful for polling external APIs that don't provide push notifications.
 * The function is called repeatedly with `interval` milliseconds between each call
 * until `isDone` returns `true`, at which point the result is returned.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Polling a payment status with {@linkcode deadline}
 * ```ts no-assert
 * import { poll } from "@std/async/unstable-poll";
 * import { deadline } from "@std/async/deadline";
 *
 * async function getPaymentStatus(id: string): Promise<{ status: string }> {
 *   // Fetch payment status from API
 *   return { status: "pending" };
 * }
 *
 * const result = await deadline(
 *   poll(
 *     () => getPaymentStatus("payment-123"),
 *     (payment) => payment.status !== "pending",
 *     { interval: 1000 },
 *   ),
 *   30_000, // 30 second timeout
 * );
 * ```
 *
 * @example Using AbortSignal for timeout
 * ```ts no-assert
 * import { poll } from "@std/async/unstable-poll";
 *
 * const result = await poll(
 *   () => fetch("https://api.example.com/status").then((r) => r.json()),
 *   (data) => data.completed === true,
 *   { signal: AbortSignal.timeout(30_000) },
 * );
 * ```
 *
 * @throws {DOMException & { name: "AbortError" }} If the optional signal is
 * aborted with the default `reason`.
 * @throws {AbortSignal["reason"]} If the optional signal is aborted with a
 * custom `reason`.
 * @throws If `fn` throws, that error propagates up immediately.
 * @throws If `isDone` throws, that error propagates up immediately.
 * @typeParam T The return type of the function being polled.
 * @param fn The function to poll. Can be sync or async.
 * @param isDone A predicate that returns `true` when polling should stop.
 * @param options Additional options.
 * @returns The result of `fn` when `isDone` returns `true`.
 */
export async function poll<T>(
  fn: () => T,
  isDone: (result: Awaited<T>) => boolean,
  options: PollOptions = {},
): Promise<Awaited<T>> {
  const { signal, interval = 1000 } = options;
  const delayOptions = signal ? { signal } : undefined;

  while (true) {
    signal?.throwIfAborted();

    const result = await fn();

    if (isDone(result)) {
      return result;
    }

    await delay(interval, delayOptions);
  }
}
