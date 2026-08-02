// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Options for {@linkcode abortable}. */
export interface AbortableOptions {
  /**
   * The signal to abort the promise or iteration with. When `undefined`, the
   * input is never aborted.
   *
   * @default {undefined}
   */
  signal?: AbortSignal | undefined;
}

/**
 * Make a {@linkcode Promise} abortable with the given signal.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * The signal can also be passed inside an {@linkcode AbortableOptions}
 * object. When `options.signal` is `undefined`, the promise is returned
 * unchanged and never aborts.
 *
 * @throws {DOMException} If the signal is already aborted and `signal.reason`
 * is undefined. Otherwise, throws `signal.reason`.
 * @typeParam T The type of the provided and returned promise.
 * @param p The promise to make abortable.
 * @param signal The signal to abort the promise with, or an
 * {@linkcode AbortableOptions} object carrying an optional signal.
 * @returns A promise that can be aborted.
 *
 * @example Error-handling a timeout
 * ```ts
 * import { abortable } from "@std/async/unstable-abortable";
 * import { delay } from "@std/async/delay";
 * import { assertRejects, assertEquals } from "@std/assert";
 *
 * const promise = delay(1_000);
 *
 * // Rejects with `DOMException` (name `"TimeoutError"`) after 100 ms
 * const error = await assertRejects(
 *   () => abortable(promise, AbortSignal.timeout(100)),
 *   DOMException,
 * );
 * assertEquals(error.name, "TimeoutError");
 * ```
 *
 * @example Error-handling an abort
 * ```ts
 * import { abortable } from "@std/async/unstable-abortable";
 * import { delay } from "@std/async/delay";
 * import { assertRejects, assertEquals } from "@std/assert";
 *
 * const promise = delay(1_000);
 * const controller = new AbortController();
 * controller.abort(new Error("This is my reason"));
 *
 * // Rejects with `DOMException` immediately
 * await assertRejects(
 *   () => abortable(promise, controller.signal),
 *   Error,
 *   "This is my reason"
 * );
 * ```
 *
 * @example Passing an optional signal through options
 * ```ts
 * import { abortable } from "@std/async/unstable-abortable";
 * import { assertEquals } from "@std/assert";
 *
 * async function process(options: { signal?: AbortSignal } = {}) {
 *   return await abortable(Promise.resolve("Hello"), options);
 * }
 *
 * // Without a signal, the promise resolves as usual
 * assertEquals(await process(), "Hello");
 * ```
 */
export function abortable<T>(
  p: Promise<T>,
  signal: AbortSignal | AbortableOptions,
): Promise<T>;
/**
 * Make an {@linkcode AsyncIterable} abortable with the given signal.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * The signal can also be passed inside an {@linkcode AbortableOptions}
 * object. When `options.signal` is `undefined`, the returned generator
 * mirrors the input and never aborts.
 *
 * @throws {DOMException} If the signal is already aborted and `signal.reason`
 * is undefined. Otherwise, throws `signal.reason`.
 * @typeParam T The type of the provided and returned async iterable.
 * @param p The async iterable to make abortable.
 * @param signal The signal to abort the iteration with, or an
 * {@linkcode AbortableOptions} object carrying an optional signal.
 * @returns An async iterable that can be aborted.
 *
 * @example Error-handling a timeout
 * ```ts
 * import { abortable } from "@std/async/unstable-abortable";
 * import { delay } from "@std/async/delay";
 * import { assertRejects, assertEquals } from "@std/assert";
 *
 * const asyncIter = async function* () {
 *   yield "Hello";
 *   await delay(1_000);
 *   yield "World";
 * };
 *
 * const items: string[] = [];
 * // Below throws `DOMException` (name `"TimeoutError"`) after 100 ms and items
 * // become `["Hello"]`
 * const error = await assertRejects(
 *   async () => {
 *     for await (const item of abortable(asyncIter(), AbortSignal.timeout(100))) {
 *       items.push(item);
 *     }
 *   },
 *   DOMException,
 * );
 * assertEquals(error.name, "TimeoutError");
 * assertEquals(items, ["Hello"]);
 * ```
 *
 * @example Error-handling an abort
 * ```ts
 * import { abortable } from "@std/async/unstable-abortable";
 * import { delay } from "@std/async/delay";
 * import { assertRejects, assertEquals } from "@std/assert";
 *
 * const asyncIter = async function* () {
 *   yield "Hello";
 *   await delay(1_000);
 *   yield "World";
 * };
 * const controller = new AbortController();
 * controller.abort(new Error("This is my reason"));
 *
 * const items: string[] = [];
 * // Below throws `DOMException` immediately
 * await assertRejects(
 *   async () => {
 *     for await (const item of abortable(asyncIter(), controller.signal)) {
 *       items.push(item);
 *     }
 *   },
 *   Error,
 *   "This is my reason"
 * );
 * assertEquals(items, []);
 * ```
 *
 * @example Passing an optional signal through options
 * ```ts
 * import { abortable } from "@std/async/unstable-abortable";
 * import { assertEquals } from "@std/assert";
 *
 * const asyncIter = async function* () {
 *   yield "Hello";
 *   yield "World";
 * };
 *
 * // Without a signal, iteration proceeds as usual
 * const items = await Array.fromAsync(abortable(asyncIter(), {}));
 * assertEquals(items, ["Hello", "World"]);
 * ```
 */

export function abortable<T>(
  p: AsyncIterable<T>,
  signal: AbortSignal | AbortableOptions,
): AsyncGenerator<T>;
export function abortable<T>(
  p: Promise<T> | AsyncIterable<T>,
  signal: AbortSignal | AbortableOptions,
): Promise<T> | AsyncGenerator<T> {
  if (!(signal instanceof AbortSignal)) {
    if (!signal.signal) {
      // The iterable overload promises an AsyncGenerator, so a plain
      // iterable still needs wrapping to gain next/return/throw.
      return p instanceof Promise ? p : passthroughAsyncIterable(p);
    }
    signal = signal.signal;
  }
  if (p instanceof Promise) {
    return abortablePromise(p, signal);
  } else {
    return abortableAsyncIterable(p, signal);
  }
}

// TNext is `undefined` to satisfy pre-5.6 TypeScript (Deno v1.x), where
// AsyncIterator defaults TNext to `undefined` instead of `any` (TS2766).
async function* passthroughAsyncIterable<T>(
  p: AsyncIterable<T>,
): AsyncGenerator<T, unknown, undefined> {
  return yield* p;
}

function abortablePromise<T>(
  p: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  const { promise, reject } = Promise.withResolvers<never>();
  const abort = () => reject(signal.reason);
  if (signal.aborted) abort();
  signal.addEventListener("abort", abort, { once: true });
  return Promise.race([promise, p]).finally(() => {
    signal.removeEventListener("abort", abort);
  });
}

async function* abortableAsyncIterable<T>(
  p: AsyncIterable<T>,
  signal: AbortSignal,
): AsyncGenerator<T> {
  signal.throwIfAborted();
  const { promise, reject } = Promise.withResolvers<never>();
  const abort = () => reject(signal.reason);
  signal.addEventListener("abort", abort, { once: true });

  const it = p[Symbol.asyncIterator]();
  let completed = false;
  try {
    while (true) {
      const { done, value } = await Promise.race([promise, it.next()]);
      if (done) {
        completed = true;
        const result = await it.return?.(value);
        return result?.value;
      }
      yield value;
    }
  } finally {
    signal.removeEventListener("abort", abort);
    // Close the source on abort or early consumer exit; the done path has
    // already closed it with the forwarded return value.
    if (!completed) await it.return?.();
  }
}
