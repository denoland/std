// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Options for {@linkcode pooledMapSettled}. */
export interface PooledMapSettledOptions {
  /**
   * The maximum count of items being processed concurrently. Must be a
   * positive integer.
   */
  poolLimit: number;
  /**
   * An AbortSignal to cancel the pooled mapping operation.
   *
   * If the signal is aborted, no new items will begin processing. All currently
   * executing items are allowed to finish and their settled results are yielded.
   * The iterator then rejects with the signal's reason.
   *
   * @default {undefined}
   */
  signal?: AbortSignal;
}

/**
 * Like {@linkcode pooledMap}, but does not fail fast. Every item is processed
 * regardless of earlier failures. Results are yielded as
 * {@linkcode PromiseSettledResult} objects in input order.
 *
 * The relationship to `pooledMap` mirrors `Promise.allSettled` vs `Promise.all`.
 *
 * If the input iterable itself throws, all currently executing items are
 * allowed to finish and their settled results are yielded, then the iterator
 * closes. The error from the input iterable is not propagated to the consumer.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { pooledMapSettled } from "@std/async/unstable-pool-settled";
 * import { assertEquals } from "@std/assert";
 *
 * const results = pooledMapSettled(
 *   [1, 2, 3],
 *   (i) => {
 *     if (i === 2) throw new Error("bad");
 *     return Promise.resolve(i);
 *   },
 *   { poolLimit: 2 },
 * );
 *
 * assertEquals(await Array.fromAsync(results), [
 *   { status: "fulfilled", value: 1 },
 *   { status: "rejected", reason: new Error("bad") },
 *   { status: "fulfilled", value: 3 },
 * ]);
 * ```
 *
 * @example With AbortSignal
 * ```ts no-assert ignore
 * import { pooledMapSettled } from "@std/async/unstable-pool-settled";
 *
 * const results = pooledMapSettled([1, 2, 3], async (i) => {
 *   await new Promise((r) => setTimeout(r, 1000));
 *   return i;
 * }, { poolLimit: 2, signal: AbortSignal.timeout(5_000) });
 *
 * for await (const result of results) {
 *   console.log(result);
 * }
 * ```
 *
 * @typeParam T the input type.
 * @typeParam R the output type.
 * @param array The input iterable.
 * @param iteratorFn The transform function (sync or async).
 * @param options Configuration for concurrency and cancellation.
 * @returns An async iterator yielding `PromiseSettledResult<R>` for each item,
 *          in the order items were yielded from the input.
 */
export function pooledMapSettled<T, R>(
  array: Iterable<T> | AsyncIterable<T>,
  iteratorFn: (data: T) => R | Promise<R>,
  options: PooledMapSettledOptions,
): AsyncIterableIterator<PromiseSettledResult<R>> {
  const { poolLimit, signal } = options;

  if (!Number.isInteger(poolLimit) || poolLimit < 1) {
    throw new RangeError(
      `Cannot pool as 'poolLimit' must be a positive integer: received ${poolLimit}`,
    );
  }

  type Settled = PromiseSettledResult<R>;

  const ABORT_SENTINEL = Symbol();

  const res = new TransformStream<
    Promise<Settled | typeof ABORT_SENTINEL>,
    Settled
  >({
    async transform(
      p: Promise<Settled | typeof ABORT_SENTINEL>,
      controller: TransformStreamDefaultController<Settled>,
    ) {
      const result = await p;
      if (result === ABORT_SENTINEL) {
        controller.error(signal?.reason);
        return;
      }
      controller.enqueue(result);
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

    function settle(fn: () => R | Promise<R>): Promise<Settled> {
      return Promise.resolve()
        .then(fn)
        .then(
          (value): PromiseFulfilledResult<R> => ({
            status: "fulfilled",
            value,
          }),
          (reason): PromiseRejectedResult => ({ status: "rejected", reason }),
        );
    }

    try {
      signal?.throwIfAborted();

      for await (const item of array) {
        signal?.throwIfAborted();

        const p = settle(() => iteratorFn(item));
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
      // Wait for in-flight work so their settled results are still yielded in
      // order, then write a sentinel that causes the stream to error with the
      // abort reason.
      await Promise.all(executing).catch(() => {});
      if (signal?.aborted) {
        writer.write(Promise.resolve(ABORT_SENTINEL)).catch(() => {});
      } else {
        writer.close();
      }
    }
  })();

  // Feature test until browser coverage is adequate
  return Symbol.asyncIterator in res.readable &&
      typeof res.readable[Symbol.asyncIterator] === "function"
    ? (res.readable[Symbol.asyncIterator] as () => AsyncIterableIterator<
      Settled
    >)()
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
