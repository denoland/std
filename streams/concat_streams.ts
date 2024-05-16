// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * A union of AsyncIterable and Iterable
 */
export type Iter<T> = AsyncIterable<T> | Iterable<T>;

/**
 * A TransformStream that concatenates multiple streams into a single ReadableStream in order.
 * Works with anything that implements the `Symbol.asyncIterator` or `Symbol.iterator`.
 *
 * @template T Type of the chunks in the iterables.
 *
 * @example .pipeThrough Usage
 * ```ts
 * import { ConcatStreams } from "@std/streams/concat-streams"
 *
 * const stream1 = ReadableStream.from([1, 2, 3])
 * const stream2 = ReadableStream.from([4, 5, 6])
 * const stream3 = ReadableStream.from([7, 8, 9])
 *
 * for await (
 *   const x of ReadableStream
 *     .from([stream1, stream2, stream3])
 *     .pipeThrough(new ConcatStreams())
 * )
 *   console.log(x)
 * ```
 *
 * @example argument Usage
 * ```ts
 * import { ConcatStreams } from "@std/streams/concat-streams"
 *
 * const stream1 = ReadableStream.from([1, 2, 3])
 * const stream2 = ReadableStream.from([4, 5, 6])
 * const stream3 = ReadableStream.from([7, 8, 9])
 *
 * for await (const x of new ConcatStreams([stream1, stream2, stream3]).readable)
 *   console.log(x)
 * ```
 */
export class ConcatStreams<T> {
  #readable: ReadableStream<T>;
  #writable: WritableStream<Iter<T>>;
  /**
   * Constructs a new instance.
   * @param streams (Optional): If provided then this.writable will be locked.
   */
  constructor(streams?: Iter<Iter<T>>) {
    const { readable, writable } = new TransformStream<Iter<T>, Iter<T>>();
    const gen = async function* () {
      for await (const stream of readable) {
        for await (const chunk of stream) {
          yield chunk;
        }
      }
    }();
    this.#readable = new ReadableStream({
      async pull(controller) {
        const { done, value } = await gen.next();
        if (done) {
          return controller.close();
        }
        controller.enqueue(value);
      },
    });
    this.#writable = writable;

    if (streams) {
      const gen = async function* () {
        for await (const stream of streams) {
          yield stream;
        }
      }();
      new ReadableStream<Iter<T>>({
        async pull(controller) {
          const { done, value } = await gen.next();
          if (done) {
            return controller.close();
          }
          controller.enqueue(value);
        },
      })
        .pipeTo(this.#writable);
    }
  }

  get readable(): ReadableStream<T> {
    return this.#readable;
  }

  get writable(): WritableStream<Iter<T>> {
    return this.#writable;
  }
}
