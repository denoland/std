// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { deadline } from "./deadline.ts";

/** Options for {@linkcode waitFor}. */
export interface WaitForOptions {
  /** Signal used to abort the waitFor. */
  signal?: AbortSignal;
  /** Indicates the step jump in time to wait for the predicate to be true.
   *
   * @default {100}
   */
  step?: number;
}

/**
 * Resolve a {@linkcode Promise} after a given predicate becomes true or the
 * timeout amount of milliseconds has been reached.
 *
 * @throws {DOMException} If signal is aborted before either the waitFor
 * predicate is true or the timeout duration was reached, and `signal.reason`
 * is undefined.
 * @param predicate a Nullary (no arguments) function returning a boolean
 * @param ms Duration in milliseconds for how long the waitFor should last.
 * @param options Additional options.
 *
 * @example Basic usage
 * ```ts ignore
 * import { waitFor } from "@std/async/unstable-wait-for";
 *
 * // Deno server to acknowledge reception of request/webhook
 * let requestReceived = false;
 * Deno.serve((_req) => {
 *   requestReceived = true;
 *   return new Response("Hello, world");
 * });
 *
 * // ...
 * waitFor(() => requestReceived, 10000);
 * // If less than 10 seconds pass, the requestReceived flag will be true
 * // assert(requestReceived);
 * // ...
 * ```
 */
export function waitFor(
  predicate: () => boolean | Promise<boolean>,
  ms: number,
  options: WaitForOptions = {},
): Promise<void> {
  const { step = 100 } = options;

  // Create a new promise that resolves when the predicate is true
  let timer: number;
  const p: Promise<void> = new Promise(function (resolve) {
    const setTimer = () => {
      timer = setTimeout(async () => {
        if (await predicate()) {
          resolve();
        } else {
          setTimer();
        }
      }, step);
    };
    setTimer();
  });

  // Return a deadline promise
  return deadline(p, ms, options).finally(() => clearTimeout(timer));
}
