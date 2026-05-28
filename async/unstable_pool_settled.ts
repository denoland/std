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
 * rejects with the original error from the input iterable.
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
 * const settled = await Array.fromAsync(results);
 * assertEquals(settled.length, 3);
 * assertEquals(settled[0], { status: "fulfilled", value: 1 });
 * assertEquals(settled[1]!.status, "rejected");
 * assertEquals(settled[2], { status: "fulfilled", value: 3 });
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
 * @throws {RangeError} If `poolLimit` is not a positive integer.
 * @throws The signal's `reason` if the signal is aborted. Already-started
 *         items are allowed to settle before the rejection is surfaced. If the
 *         input iterable also throws while the signal is already aborted, the
 *         abort reason is used rather than the iterable's error.
 * @throws The original error if the input iterable throws while the signal is
 *         not aborted. Already-started items are allowed to settle before the
 *         rejection is surfaced.
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

  const ABORT_SENTINEL = Symbol("abort");
  const SOURCE_ERROR_SENTINEL = Symbol("sourceError");
  let sourceError: unknown;

  type Sentinel = typeof ABORT_SENTINEL | typeof SOURCE_ERROR_SENTINEL;

  const res = new TransformStream<Promise<Settled | Sentinel>, Settled>({
    async transform(
      p: Promise<Settled | Sentinel>,
      controller: TransformStreamDefaultController<Settled>,
    ) {
      const result = await p;
      if (result === ABORT_SENTINEL) {
        controller.error(signal?.reason);
        return;
      }
      if (result === SOURCE_ERROR_SENTINEL) {
        controller.error(sourceError);
        return;
      }
      controller.enqueue(result);
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

          const item = next.value;
          const p = settle(() => iteratorFn(item));
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

      await Promise.all(executing);
      writer.close().catch(() => {});
    } catch (caughtError) {
      const wasAborted = signal?.aborted ?? false;
      await Promise.all(executing).catch(() => {});
      if (wasAborted) {
        writer.write(Promise.resolve(ABORT_SENTINEL)).catch(() => {});
      } else {
        sourceError = caughtError;
        writer
          .write(Promise.resolve(SOURCE_ERROR_SENTINEL))
          .catch(() => {});
      }
    } finally {
      removeAbortListener?.();
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
