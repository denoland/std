// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Error message emitted from the thrown error while mapping. */
const ERROR_WHILE_MAPPING_MESSAGE =
  "Cannot complete the mapping as an error was thrown from an item";

/** Options for {@linkcode pooledMap}. */
export interface PooledMapOptions {
  /**
   * The maximum count of items being processed concurrently. Must be a
   * positive integer.
   */
  poolLimit: number;
  /**
   * An AbortSignal to cancel the pooled mapping operation.
   *
   * If the signal is aborted, no new items will begin processing and the
   * source iterator is closed. All currently executing items are allowed to
   * finish and are still yielded on success. The iterator then rejects with
   * the signal's reason, or with an `AggregateError` collecting the rejections
   * if any of those in-flight items failed.
   *
   * @default {undefined}
   */
  signal?: AbortSignal;
}

/**
 * Transforms values from an (async) iterable into another async iterable.
 * The transforms are done concurrently, with a max concurrency defined by
 * `poolLimit`.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * If an error is thrown from `iteratorFn`, no new transformations will begin.
 * All currently executing transformations are allowed to finish and still
 * yielded on success. After that, the rejections among them are gathered and
 * thrown by the iterator in an `AggregateError`.
 *
 * Unlike the stable `pooledMap` from `@std/async/pool`, the pool limit is
 * passed last, consistent with `pooledMapSettled`.
 *
 * @example Usage
 * ```ts
 * import { pooledMap } from "@std/async/unstable-pool";
 * import { assertEquals } from "@std/assert";
 *
 * const results = pooledMap(
 *   [1, 2, 3],
 *   (i) => new Promise((r) => setTimeout(() => r(i), 1000)),
 *   2,
 * );
 *
 * assertEquals(await Array.fromAsync(results), [1, 2, 3]);
 * ```
 *
 * @typeParam T the input type.
 * @typeParam R the output type.
 * @param array The input array for mapping.
 * @param iteratorFn The function to call for every item of the array.
 * @param poolLimit The maximum count of items being processed concurrently.
 * @returns The async iterator with the transformed values.
 * @throws {RangeError} If `poolLimit` is not a positive integer.
 */
export function pooledMap<T, R>(
  array: Iterable<T> | AsyncIterable<T>,
  iteratorFn: (data: T) => Promise<R>,
  poolLimit: number,
): AsyncIterableIterator<R>;

/**
 * Transforms values from an (async) iterable into another async iterable.
 * The transforms are done concurrently, with a max concurrency defined by
 * {@linkcode PooledMapOptions.poolLimit}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * If an error is thrown from `iteratorFn`, no new transformations will begin.
 * All currently executing transformations are allowed to finish and still
 * yielded on success. After that, the rejections among them are gathered and
 * thrown by the iterator in an `AggregateError`.
 *
 * @example Usage with options
 * ```ts
 * import { pooledMap } from "@std/async/unstable-pool";
 * import { assertEquals } from "@std/assert";
 *
 * const results = pooledMap(
 *   [1, 2, 3],
 *   (i) => new Promise((r) => setTimeout(() => r(i), 1000)),
 *   { poolLimit: 2 },
 * );
 *
 * assertEquals(await Array.fromAsync(results), [1, 2, 3]);
 * ```
 *
 * @example Cancellation with AbortSignal
 * ```ts
 * import { pooledMap } from "@std/async/unstable-pool";
 * import { assertRejects } from "@std/assert";
 *
 * const controller = new AbortController();
 * const results = pooledMap(
 *   [1, 2, 3, 4, 5],
 *   (i) => new Promise((r) => setTimeout(() => r(i), 1000)),
 *   { poolLimit: 2, signal: controller.signal },
 * );
 *
 * controller.abort(new Error("cancelled"));
 *
 * await assertRejects(
 *   () => Array.fromAsync(results),
 *   Error,
 *   "cancelled",
 * );
 * ```
 *
 * @typeParam T the input type.
 * @typeParam R the output type.
 * @param array The input array for mapping.
 * @param iteratorFn The function to call for every item of the array.
 * @param options Configuration for concurrency and cancellation.
 * @returns The async iterator with the transformed values.
 * @throws {RangeError} If `poolLimit` is not a positive integer.
 * @throws The signal's `reason` if the signal is aborted and no item failed.
 *         In-flight items are allowed to settle first, and the source
 *         iterator is closed.
 * @throws {AggregateError} If any `iteratorFn` call rejects, collecting all
 *         rejections — including rejections from items that were in flight
 *         when the signal was aborted.
 */
export function pooledMap<T, R>(
  array: Iterable<T> | AsyncIterable<T>,
  iteratorFn: (data: T) => Promise<R>,
  options: PooledMapOptions,
): AsyncIterableIterator<R>;

export function pooledMap<T, R>(
  array: Iterable<T> | AsyncIterable<T>,
  iteratorFn: (data: T) => Promise<R>,
  options: number | PooledMapOptions,
): AsyncIterableIterator<R> {
  const { poolLimit, signal } = typeof options === "number"
    ? { poolLimit: options, signal: undefined }
    : options;

  if (!Number.isInteger(poolLimit) || poolLimit < 1) {
    throw new RangeError(
      `Cannot pool as 'poolLimit' must be a positive integer: received ${poolLimit}`,
    );
  }

  const ABORT_SENTINEL = Symbol("abort");

  const res = new TransformStream<Promise<R | typeof ABORT_SENTINEL>, R>({
    async transform(
      p: Promise<R | typeof ABORT_SENTINEL>,
      controller: TransformStreamDefaultController<R>,
    ) {
      try {
        const result = await p;
        if (result === ABORT_SENTINEL) {
          controller.error(signal?.reason);
          return;
        }
        controller.enqueue(result);
      } catch (e) {
        if (
          e instanceof AggregateError &&
          e.message === ERROR_WHILE_MAPPING_MESSAGE
        ) {
          controller.error(e);
        }
        // Individual item rejections are reported via the AggregateError.
      }
    },
  });

  (async () => {
    const writer = res.writable.getWriter();
    const executing = new Set<Promise<unknown>>();

    let abortDeferred: PromiseWithResolvers<never> | undefined;
    let removeAbortListener: (() => void) | undefined;
    if (signal) {
      abortDeferred = Promise.withResolvers<never>();
      const onAbort = () => abortDeferred!.reject(signal.reason);
      signal.addEventListener("abort", onAbort, { once: true });
      removeAbortListener = () => signal.removeEventListener("abort", onAbort);
      abortDeferred.promise.catch(() => {});
    }

    function raceWithSignal(): Promise<unknown> {
      if (!abortDeferred) return Promise.race(executing);
      executing.add(abortDeferred.promise);
      return Promise.race(executing).finally(() => {
        executing.delete(abortDeferred!.promise);
      });
    }

    try {
      signal?.throwIfAborted();

      const it = (Symbol.asyncIterator in Object(array))
        ? (array as AsyncIterable<T>)[Symbol.asyncIterator]()
        : (array as Iterable<T>)[Symbol.iterator]();

      try {
        while (true) {
          const nextPromise = Promise.resolve(it.next());
          if (abortDeferred) nextPromise.catch(() => {});
          const next = abortDeferred
            ? await Promise.race([nextPromise, abortDeferred.promise])
            : await nextPromise;

          if (next.done) break;
          signal?.throwIfAborted();

          const item = next.value;
          const p = Promise.resolve().then(() => iteratorFn(item));
          // Only write on success. If we `writer.write()` a rejected promise,
          // that will end the iteration. We don't want that yet. Instead let it
          // fail the race, taking us to the catch block where all currently
          // executing jobs are allowed to finish and all rejections among them
          // can be reported together.
          writer.write(p).catch(() => {});
          const e: Promise<unknown> = p.then(() => executing.delete(e));
          executing.add(e);
          if (executing.size >= poolLimit) {
            await raceWithSignal();
          }
        }
      } finally {
        if (signal?.aborted) {
          Promise.resolve(it.return?.()).catch(() => {});
        } else {
          await it.return?.();
        }
      }

      if (abortDeferred) {
        await Promise.race([Promise.all(executing), abortDeferred.promise]);
      } else {
        await Promise.all(executing);
      }
      writer.close().catch(() => {});
    } catch {
      const errors = [];
      for (const result of await Promise.allSettled(executing)) {
        if (result.status === "rejected") {
          errors.push(result.reason);
        }
      }
      if (errors.length === 0 && signal?.aborted) {
        writer.write(Promise.resolve(ABORT_SENTINEL)).catch(() => {});
      } else {
        writer.write(Promise.reject(
          new AggregateError(errors, ERROR_WHILE_MAPPING_MESSAGE),
        )).catch(() => {});
      }
    } finally {
      removeAbortListener?.();
    }
  })();

  // Feature test until browser coverage is adequate
  return Symbol.asyncIterator in res.readable &&
      typeof res.readable[Symbol.asyncIterator] === "function"
    ? (res.readable[Symbol.asyncIterator] as () => AsyncIterableIterator<R>)()
    : (async function* () {
      const reader = res.readable.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield value;
        }
      } finally {
        reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    })();
}
