// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { deferred } from "./deferred.ts";

export class AbortedError extends Error {
  reason?: any;

  constructor(reason?: any) {
    super(reason ? `Aborted: ${reason}` : "Aborted");
    this.name = "AbortedError";
    this.reason = reason;
  }
}

/**
 * Make Promise or AsyncIterable abortable with a given signal.
 */
export function abortable<T>(p: Promise<T>, signal: AbortSignal): Promise<T>;
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

function abortablePromise<T>(p: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(new AbortedError(signal.reason));
  }
  const waiter = deferred<never>();
  const abort = () => waiter.reject(new AbortedError(signal.reason));
  signal.addEventListener("abort", abort, { once: true });
  return Promise.race([
    waiter,
    p.finally(() => {
      signal.removeEventListener("abort", abort);
    }),
  ]);
}

async function* abortableAsyncIterable<T>(
  p: AsyncIterable<T>,
  signal: AbortSignal,
): AsyncGenerator<T> {
  if (signal.aborted) {
    throw new AbortedError(signal.reason);
  }
  const waiter = deferred<never>();
  const abort = () => waiter.reject(new AbortedError(signal.reason));
  signal.addEventListener("abort", abort, { once: true });

  const it = p[Symbol.asyncIterator]();
  while (true) {
    const { done, value } = await Promise.race([waiter, it.next()]);
    if (done) {
      signal.removeEventListener("abort", abort);
      return;
    }
    yield value;
  }
}
