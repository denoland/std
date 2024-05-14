// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * A transform stream that concatenates multiple readable streams into a single
 * stream.
 *
 * @template I Type of the items in the readable streams.
 *
 * @example Usage
 * ```ts
 * import { ConcatStreams } from "@std/streams/concat-streams";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const stream1 = ReadableStream.from([1, 2, 3]);
 * const stream2 = ReadableStream.from([4, 5, 6]);
 * const stream3 = ReadableStream.from([7, 8, 9]);
 *
 * const concatStream = ReadableStream
 *   .from([stream1, stream2, stream3])
 *   .pipeThrough(new ConcatStreams());
 *
 * const result = await Array.fromAsync(concatStream);
 *
 * assertEquals(result, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
 * ```
 */
export class ConcatStreams<I> extends TransformStream<ReadableStream<I>, I> {
  /** Constructs a new instance. */
  constructor() {
    super({
      async transform(stream, controller) {
        for await (const value of stream) {
          controller.enqueue(value);
        }
      },
    });
  }
}
