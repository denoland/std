// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * concatStreams is a function that concatenates any iterable of ReadableStreams
 * into a single ReadableStream.
 *
 * @template T Type of the chunks in the ReadableStream.
 *
 * @example argument Usage
 * ```ts
 * import { concatStreams } from "@std/streams/concat-streams"
 *
 * const stream1 = ReadableStream.from([1, 2, 3])
 * const stream2 = ReadableStream.from([4, 5, 6])
 * const stream3 = ReadableStream.from([7, 8, 9])
 *
 * for await (const x of concatStreams([stream1, stream2, stream3]))
 *   console.log(x)
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
      lock: false,
      async pull(controller) {
        while (this.lock) {
          await new Promise((a) => setTimeout(a, 0));
        }
        this.lock = true;
        const { done, value } = await gen.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
        this.lock = false;
      },
      async cancel(reason) {
        await gen.throw(reason).catch(() => {});
      },
    } as UnderlyingSource<T> & { lock: boolean },
  );
}
