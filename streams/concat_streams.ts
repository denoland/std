// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Concatenates multiple `ReadableStream`s into a single ordered `ReadableStream`.
 *
 * @template T Type of the chunks in the streams.
 *
 * @param streams An iterable of `ReadableStream`s.
 *
 * @example Usage
 * ```ts
 * import { concatStreams } from "@std/streams/concat-streams";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const stream1 = ReadableStream.from([1, 2, 3]);
 * const stream2 = ReadableStream.from([4, 5, 6]);
 * const stream3 = ReadableStream.from([7, 8, 9]);
 *
 * assertEquals(
 *   await Array.fromAsync(concatStreams([stream1, stream2, stream3])),
 *   [1, 2, 3, 4, 5, 6, 7, 8, 9]
 * );
 * ```
 */
export function concatStreams<T>(
  streams: AsyncIterable<ReadableStream<T>> | Iterable<ReadableStream<T>>,
): ReadableStream<T> {
  const gen = async function* () {
    const iter = Symbol.asyncIterator in streams
      ? streams[Symbol.asyncIterator]()
      : streams[Symbol.iterator]();
    x: while (true) {
      const { done, value } = await iter.next();
      if (done) {
        break;
      }
      const reader = value.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        try {
          yield value;
        } catch (reason) {
          const promises = [reader.cancel(reason)];
          while (true) {
            const { done, value } = await iter.next();
            if (done) {
              break;
            }
            promises.push(value.cancel(reason));
          }
          await Promise.allSettled(promises);
          break x;
        }
      }
    }
  }();
  return new ReadableStream<T>(
    {
      async pull(controller) {
        const { done, value } = await gen.next();
        if (done) {
          return controller.close();
        }
        controller.enqueue(value);
      },
      async cancel(reason) {
        await gen.throw(reason).catch(() => {});
      },
    },
  );
}
