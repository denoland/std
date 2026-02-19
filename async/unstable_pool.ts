// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Error message emitted from the thrown error while mapping. */
const ERROR_WHILE_MAPPING_MESSAGE =
  "Cannot complete the mapping as an error was thrown from an item";

/** Options for {@linkcode pooledMap}. */
export interface PooledMapOptions {
  /**
   * The maximum count of items being processed concurrently.
   */
  poolLimit: number;
  /**
   * An AbortSignal to cancel the pooled mapping operation.
   *
   * If the signal is aborted, no new items will begin processing. All currently
   * executing items are allowed to finish. The iterator then rejects with the
   * signal's reason.
   *
   * @default {undefined}
   */
  signal?: AbortSignal;
}

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
 * @example Usage
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
 * @param options Options including pool limit and abort signal.
 * @returns The async iterator with the transformed values.
 */
export function pooledMap<T, R>(
  array: Iterable<T> | AsyncIterable<T>,
  iteratorFn: (data: T) => Promise<R>,
  options: PooledMapOptions,
): AsyncIterableIterator<R> {
  const { poolLimit, signal } = options;

  if (!Number.isInteger(poolLimit) || poolLimit < 1) {
    throw new RangeError("'poolLimit' must be a positive integer");
  }

  const res = new TransformStream<Promise<R>, R>({
    async transform(
      p: Promise<R>,
      controller: TransformStreamDefaultController<R>,
    ) {
      try {
        const s = await p;
        controller.enqueue(s);
      } catch (e) {
        if (signal?.aborted) {
          controller.error(signal.reason);
        } else if (
          e instanceof AggregateError &&
          e.message === ERROR_WHILE_MAPPING_MESSAGE
        ) {
          controller.error(e as unknown);
        }
      }
    },
  });

  (async () => {
    const writer = res.writable.getWriter();
    const executing: Array<Promise<unknown>> = [];

    function raceWithSignal(
      promises: Array<Promise<unknown>>,
    ): Promise<unknown> {
      if (!signal) return Promise.race(promises);
      const { promise, resolve, reject } = Promise.withResolvers<never>();
      const onAbort = () => reject(signal.reason);
      signal.addEventListener("abort", onAbort, { once: true });
      return Promise.race([...promises, promise]).finally(() => {
        signal.removeEventListener("abort", onAbort);
        resolve(undefined as never);
      });
    }

    try {
      signal?.throwIfAborted();

      for await (const item of array) {
        signal?.throwIfAborted();

        const p = Promise.resolve().then(() => iteratorFn(item));
        // Only write on success. If we `writer.write()` a rejected promise,
        // that will end the iteration. We don't want that yet. Instead let it
        // fail the race, taking us to the catch block where all currently
        // executing jobs are allowed to finish and all rejections among them
        // can be reported together.
        writer.write(p);
        const e: Promise<unknown> = p.then(() =>
          executing.splice(executing.indexOf(e), 1)
        );
        executing.push(e);
        if (executing.length >= poolLimit) {
          await raceWithSignal(executing);
        }
      }
      await Promise.all(executing);
      writer.close();
    } catch {
      const errors = [];
      for (const result of await Promise.allSettled(executing)) {
        if (result.status === "rejected") {
          errors.push(result.reason);
        }
      }
      if (signal?.aborted) {
        writer.write(Promise.reject(signal.reason)).catch(() => {});
      } else {
        writer.write(Promise.reject(
          new AggregateError(errors, ERROR_WHILE_MAPPING_MESSAGE),
        )).catch(() => {});
      }
    }
  })();

  // Feature test until browser coverage is adequate
  return Symbol.asyncIterator in res.readable &&
      typeof res.readable[Symbol.asyncIterator] === "function"
    ? (res.readable[Symbol.asyncIterator] as () => AsyncIterableIterator<R>)()
    : (async function* () {
      const reader = res.readable.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
      reader.releaseLock();
    })();
}
