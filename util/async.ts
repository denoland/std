// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { assert } from "../testing/asserts.ts";

// TODO(ry) It'd be better to make Deferred a class that inherits from
// Promise, rather than an interface. This is possible in ES2016, however
// typescript produces broken code when targeting ES5 code.
// See https://github.com/Microsoft/TypeScript/issues/15202
// At the time of writing, the github issue is closed but the problem remains.
export interface Deferred<T> extends Promise<T> {
  resolve: (value?: T | PromiseLike<T>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: (reason?: any) => void;
}

/** Creates a Promise with the `reject` and `resolve` functions
 * placed as methods on the promise object itself. It allows you to do:
 *
 *     const p = deferred<number>();
 *     // ...
 *     p.resolve(42);
 */
export function deferred<T>(): Deferred<T> {
  let methods;
  const promise = new Promise<T>(
    (resolve, reject): void => {
      methods = { resolve, reject };
    }
  );
  return Object.assign(promise, methods) as Deferred<T>;
}

interface WrappedIteratorResult<T> {
  iterator: AsyncIterableIterator<T>;
  result: IteratorResult<T>;
}

/** The MuxAsyncIterator class multiplexes multiple async iterators into a
 * single stream. It currently makes a few assumptions:
 * - The iterators do not throw.
 * - The final result (the value returned and not yielded from the iterator)
 *   does not matter; if there is any, it is discarded.
 * - Adding an iterator while the multiplexer is blocked does not take effect
 *   immediately.
 */
export class MuxAsyncIterator<T> implements AsyncIterableIterator<T> {
  private iteratorNextPromiseMap: Map<
    AsyncIterableIterator<T>,
    Promise<WrappedIteratorResult<T>>
  > = new Map();

  private async wrapIteratorNext(
    iterator: AsyncIterableIterator<T>
  ): Promise<WrappedIteratorResult<T>> {
    return { iterator, result: await iterator.next() };
  }

  add(iterator: AsyncIterableIterator<T>): void {
    this.iteratorNextPromiseMap.set(iterator, this.wrapIteratorNext(iterator));
  }

  async next(): Promise<IteratorResult<T>> {
    while (this.iteratorNextPromiseMap.size > 0) {
      // Wait for the next iteration result of any of the iterators, whichever
      // yields first.
      const { iterator, result }: WrappedIteratorResult<T> = await Promise.race(
        this.iteratorNextPromiseMap.values()
      );
      assert(this.iteratorNextPromiseMap.has(iterator));

      if (result.done) {
        // The iterator that yielded is done, remove it from the map.
        this.iteratorNextPromiseMap.delete(iterator);
      } else {
        // The iterator has yielded a value. Call `next()` on it, wrap the
        // returned promise, and store it in the map.
        this.iteratorNextPromiseMap.set(
          iterator,
          this.wrapIteratorNext(iterator)
        );
        return result;
      }
    }

    // There are no iterators left in the multiplexer, so report we're done.
    return { value: null, done: true };
  }

  [Symbol.asyncIterator](): MuxAsyncIterator<T> {
    return this;
  }
}
