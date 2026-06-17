// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A {@linkcode TransformStream} that groups input chunks into fixed-size
 * batches. Emits a `T[]` every `size` input chunks and flushes any final
 * non-empty partial batch when the input closes.
 *
 * Input order is preserved.
 *
 * For grouping an in-hand iterable instead of a stream, see
 * {@link https://jsr.io/@std/collections/doc/chunk | `chunk` from `@std/collections`}.
 * For resizing `Uint8Array` chunks at the byte level, see
 * {@linkcode FixedChunkStream}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The type of the input chunks.
 *
 * @example Batch records for bulk upload
 * ```ts
 * import { BatchStream } from "@std/streams/unstable-batch-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const records = ReadableStream.from([1, 2, 3, 4, 5])
 *   .pipeThrough(new BatchStream(2));
 *
 * assertEquals(await Array.fromAsync(records), [[1, 2], [3, 4], [5]]);
 * ```
 *
 * @example Type inference inside a pipeline
 * ```ts
 * import { BatchStream } from "@std/streams/unstable-batch-stream";
 * import { assertEquals } from "@std/assert";
 *
 * interface User {
 *   id: string;
 * }
 *
 * const users: ReadableStream<User> = ReadableStream.from([
 *   { id: "a" },
 *   { id: "b" },
 *   { id: "c" },
 * ]);
 *
 * const batches: ReadableStream<User[]> = users.pipeThrough(
 *   new BatchStream(2),
 * );
 *
 * assertEquals(await Array.fromAsync(batches), [
 *   [{ id: "a" }, { id: "b" }],
 *   [{ id: "c" }],
 * ]);
 * ```
 */
export class BatchStream<T> extends TransformStream<T, T[]> {
  /**
   * Constructs a new instance.
   *
   * @param size The number of input chunks per emitted batch. Must be a
   * positive integer.
   */
  constructor(size: number) {
    if (!Number.isInteger(size) || size <= 0) {
      throw new RangeError(
        `Cannot construct BatchStream as size must be a positive integer: current value is ${size}`,
      );
    }
    let buffer: T[] = [];
    super({
      transform(chunk, controller) {
        buffer.push(chunk);
        if (buffer.length === size) {
          controller.enqueue(buffer);
          buffer = [];
        }
      },
      flush(controller) {
        if (buffer.length > 0) {
          controller.enqueue(buffer);
        }
      },
    });
  }
}
