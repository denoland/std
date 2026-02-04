// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { MuxAsyncIterator as MuxAsyncIterator_ } from "./mux_async_iterator.ts";

/**
 * Multiplexes multiple async iterators into a single stream. It currently
 * makes an assumption that the final result (the value returned and not
 * yielded from the iterator) does not matter; if there is any result, it is
 * discarded.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { MuxAsyncIterator } from "@std/async/unstable-mux-async-iterator";
 * import { assertEquals } from "@std/assert";
 *
 * async function* gen123(): AsyncIterableIterator<number> {
 *   yield 1;
 *   yield 2;
 *   yield 3;
 * }
 *
 * async function* gen456(): AsyncIterableIterator<number> {
 *   yield 4;
 *   yield 5;
 *   yield 6;
 * }
 *
 * const mux = new MuxAsyncIterator(gen123(), gen456());
 *
 * const result = await Array.fromAsync(mux);
 *
 * assertEquals(result, [1, 4, 2, 5, 3, 6]);
 * ```
 *
 * @typeParam T The type of the provided async iterables and generated async iterable.
 */
export class MuxAsyncIterator<T> extends MuxAsyncIterator_<T> {
  /**
   * Constructs a new {@linkcode MuxAsyncIterator} instance.
   *
   * @param iterables The async iterables to multiplex.
   */
  constructor(...iterables: AsyncIterable<T>[]) {
    super();
    for (const iterable of iterables) this.add(iterable);
  }
}
