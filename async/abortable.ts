// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { createAbortError } from "./_util.ts";

/**
 * Make a {@linkcode Promise} abortable with the given signal.
 *
 * @throws {DOMException} If the signal is already aborted.
 * @typeParam T The type of the provided and returned promise.
 * @param p The promise to make abortable.
 * @param signal The signal to abort the promise with.
 * @returns A promise that can be aborted.
 *
 * @example Error-handling a timeout
 * ```ts
 * import { abortable, delay } from "@std/async";
 * import { assertInstanceOf, assertEquals } from "@std/assert";
 *
 * const promise = delay(1_000);
 *
 * try {
 *   // Rejects with `DOMException` after 100 ms
 *   await abortable(promise, AbortSignal.timeout(100));
 * } catch (error) {
 *   assertInstanceOf(error, DOMException);
 *   assertEquals(error.name, "AbortError");
 *   assertEquals(error.message, "TimeoutError: Signal timed out.");
 * }
 * ```
 *
 * @example Error-handling an abort
 * ```ts
 * import { abortable, delay } from "@std/async";
 * import { assertInstanceOf, assertEquals } from "@std/assert";
 *
 * const promise = delay(1_000);
 * const controller = new AbortController();
 * controller.abort();
 *
 * try {
 *   // Rejects with `DOMException` immediately
 *   await abortable(promise, controller.signal);
 * } catch (error) {
 *   assertInstanceOf(error, DOMException);
 *   assertEquals(error.name, "AbortError");
 *   assertEquals(error.message, "The signal has been aborted");
 * }
 * ```
 */
export function abortable<T>(p: Promise<T>, signal: AbortSignal): Promise<T>;
/**
 * Make an {@linkcode AsyncIterable} abortable with the given signal.
 *
 * @throws {DOMException} If the signal is already aborted.
 * @typeParam T The type of the provided and returned async iterable.
 * @param p The async iterable to make abortable.
 * @param signal The signal to abort the promise with.
 * @returns An async iterable that can be aborted.
 *
 * @example Error-handling a timeout
 * ```ts
 * import { abortable, delay } from "@std/async";
 * import { assertInstanceOf, assertEquals } from "@std/assert";
 *
 * const asyncIter = async function* () {
 *   yield "Hello";
 *   await delay(1_000);
 *   yield "World";
 * };
 *
 * try {
 *   // Below throws `DOMException` after 100 ms and items become `["Hello"]`
 *   const items = [];
 *   for await (const item of abortable(asyncIter(), AbortSignal.timeout(100))) {
 *     items.push(item);
 *   }
 * } catch (error) {
 *   assertInstanceOf(error, DOMException);
 *   assertEquals(error.name, "AbortError");
 *   assertEquals(error.message, "TimeoutError: Signal timed out.");
 * }
 * ```
 *
 * @example Error-handling an abort
 * ```ts
 * import { abortable, delay } from "@std/async";
 * import { assertInstanceOf, assertEquals } from "@std/assert";
 *
 * const asyncIter = async function* () {
 *   yield "Hello";
 *   await delay(1_000);
 *   yield "World";
 * };
 * const controller = new AbortController();
 * controller.abort();
 *
 * try {
 *   // Below throws `DOMException` immediately
 *   const items = [];
 *   for await (const item of abortable(asyncIter(), controller.signal)) {
 *     items.push(item);
 *   }
 * } catch (error) {
 *   assertInstanceOf(error, DOMException);
 *   assertEquals(error.name, "AbortError");
 *   assertEquals(error.message, "The signal has been aborted");
 * }
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

/**
 * Make a {@linkcode Promise} abortable with the given signal.
 *
 * @typeParam T The type of the provided and returned promise.
 * @param p The promise to make abortable.
 * @param signal The signal to abort the promise with.
 * @returns A promise that can be aborted.
 *
 * @example Usage
 * ```ts no-eval
 * import { abortablePromise } from "@std/async/abortable";
 *
 * const request = fetch("https://example.com");
 *
 * const c = new AbortController();
 * setTimeout(() => c.abort(), 100);
 *
 * const p = abortablePromise(request, c.signal);
 *
 * // The below throws if the request didn't resolve in 100ms
 * await p;
 * ```
 */
export function abortablePromise<T>(
  p: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();
  const { promise, reject } = Promise.withResolvers<never>();
  const abort = () => reject(createAbortError(signal.reason));
  signal.addEventListener("abort", abort, { once: true });
  return Promise.race([promise, p]).finally(() => {
    signal.removeEventListener("abort", abort);
  });
}

/**
 * Make an {@linkcode AsyncIterable} abortable with the given signal.
 *
 * @typeParam T The type of the provided and returned async iterable.
 * @param p The async iterable to make abortable.
 * @param signal The signal to abort the promise with.
 * @returns An async iterable that can be aborted.
 *
 * @example Usage
 * ```ts no-eval
 * import {
 *   abortableAsyncIterable,
 *   delay,
 * } from "@std/async";
 *
 * const p = async function* () {
 *   yield "Hello";
 *   await delay(1000);
 *   yield "World";
 * };
 * const c = new AbortController();
 * setTimeout(() => c.abort(), 100);
 *
 * // Below throws `DOMException` after 100 ms
 * // and items become `["Hello"]`
 * const items: string[] = [];
 * for await (const item of abortableAsyncIterable(p(), c.signal)) {
 *   items.push(item);
 * }
 * ```
 */
export async function* abortableAsyncIterable<T>(
  p: AsyncIterable<T>,
  signal: AbortSignal,
): AsyncGenerator<T> {
  signal.throwIfAborted();
  const { promise, reject } = Promise.withResolvers<never>();
  const abort = () => reject(createAbortError(signal.reason));
  signal.addEventListener("abort", abort, { once: true });

  const it = p[Symbol.asyncIterator]();
  while (true) {
    const race = Promise.race([promise, it.next()]);
    race.catch(() => {
      signal.removeEventListener("abort", abort);
    });
    const { done, value } = await race;
    if (done) {
      signal.removeEventListener("abort", abort);
      return;
    }
    yield value;
  }
}
