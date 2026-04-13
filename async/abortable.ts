// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

// TODO(iuioiua): Remove `ignore` directives from following snippets
/**
 * Make a {@linkcode Promise} abortable with the given signal.
 *
 * @throws {DOMException} If the signal is already aborted and `signal.reason`
 * is undefined. Otherwise, throws `signal.reason`.
 * @typeParam T The type of the provided and returned promise.
 * @param p The promise to make abortable.
 * @param signal The signal to abort the promise with.
 * @returns A promise that can be aborted.
 *
 * @example Error-handling a timeout
 * ```ts ignore
 * import { abortable, delay } from "@std/async";
 * import { assertRejects, assertEquals } from "@std/assert";
 *
 * const promise = delay(1_000);
 *
 * // Rejects with `DOMException` after 100 ms
 * await assertRejects(
 *   () => abortable(promise, AbortSignal.timeout(100)),
 *   DOMException,
 *   "Signal timed out."
 * );
 * ```
 *
 * @example Error-handling an abort
 * ```ts ignore
 * import { abortable, delay } from "@std/async";
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
 */
export function abortable<T>(p: Promise<T>, signal: AbortSignal): Promise<T>;
/**
 * Make an {@linkcode AsyncIterable} abortable with the given signal.
 *
 * @throws {DOMException} If the signal is already aborted and `signal.reason`
 * is undefined. Otherwise, throws `signal.reason`.
 * @typeParam T The type of the provided and returned async iterable.
 * @param p The async iterable to make abortable.
 * @param signal The signal to abort the promise with.
 * @returns An async iterable that can be aborted.
 *
 * @example Error-handling a timeout
 * ```ts
 * import { abortable, delay } from "@std/async";
 * import { assertRejects, assertEquals } from "@std/assert";
 *
 * const asyncIter = async function* () {
 *   yield "Hello";
 *   await delay(1_000);
 *   yield "World";
 * };
 *
 * const items: string[] = [];
 * // Below throws `DOMException` after 100 ms and items become `["Hello"]`
 * await assertRejects(
 *   async () => {
 *     for await (const item of abortable(asyncIter(), AbortSignal.timeout(100))) {
 *       items.push(item);
 *     }
 *   },
 *   DOMException,
 *   "Signal timed out."
 * );
 * assertEquals(items, ["Hello"]);
 * ```
 *
 * @example Error-handling an abort
 * ```ts
 * import { abortable, delay } from "@std/async";
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
 */

export function abortable<T>(
  p: AsyncIterable<T>,
  signal: AbortSignal,
): AsyncGenerator<T>;
export function abortable<T>(
  p: Promise<T> | AsyncIterable<T>,
  signal: AbortSignal,
): Promise<T> | AsyncIterable<T> {
  if (p instanceof Promise) {
    return abortablePromise(p, signal);
  } else {
    return abortableAsyncIterable(p, signal);
  }
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
  try {
    while (true) {
      const race = Promise.race([promise, it.next()]);
      race.catch(() => {
        signal.removeEventListener("abort", abort);
      });
      const { done, value } = await race;
      if (done) {
        signal.removeEventListener("abort", abort);
        const result = await it.return?.(value);
        return result?.value;
      }
      yield value;
    }
  } catch (e) {
    await it.return?.();
    throw e;
  }
}
