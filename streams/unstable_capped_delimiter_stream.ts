// Copyright 2018-2025 the Deno authors. MIT license.

import { toByteStream } from "./unstable_to_byte_stream.ts";

/**
 * Represents an entry in a CappedDelimiterStream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface CappedDelimiterEntry {
  /**
   * True if the value ended with the delimiter.
   */
  match: boolean;
  /**
   * The chunk's bytes (never includes the delimiter itself).
   */
  value: Uint8Array;
}

/**
 * The options for the CappedDelimiterStream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface CappedDelimiterOptions {
  /**
   * The delimiter used to split the incoming stream.
   */
  delimiter: Uint8Array;
  /**
   * The maximum length for each emitted value.
   */
  limit: number;
}

/**
 * {@linkcode CappedDelimiterStream} is a TransformStream that splits a
 * `ReadableStream<Uint8Array>` by a provided `delimiter`, returning
 * {@linkcode CappedDelimiterEntry} objects. Each entry's match property
 * indicates whether the corresponding value ended with the delimiter. The
 * class also requires a `limit` property to specify the max length that each
 * entry can be, which can be preferable if your delimiter is unlikely to appear
 * often.
 *
 * ## Remarks
 * This TransformStream is useful over {@linkcode DelimiterStream} when you
 * need to split on a delimiter that is expected to occur rarely and want to
 * protect against unbounded buffering. Setting a `limit` prevents the stream
 * from growing its internal buffer indefinitely. When the buffer reaches the
 * specified `limit` the stream will emit a {@linkcode CappedDelimiterEntry} with
 * `{ match: false }` and continue. When the delimiter appears, the following
 * entry will have `{ match: true }`.
 *
 * This pattern is handy for protocols or file formats that use an infrequent
 * separator, like NUL, record separator, or a multi-byte boundary, while
 * otherwise streaming arbitrarily large payloads. It lets consumers process
 * intermediate chunks instead of waiting for the entire message or risking
 * excessive memory usage.
 *
 * @example
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import {
 *   CappedDelimiterStream,
 * } from "@std/streams/unstable-capped-delimiter-stream";
 *
 * const encoder = new TextEncoder();
 *
 * const readable = ReadableStream.from(["foo;beeps;;bar;;"])
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeThrough(
 *     new CappedDelimiterStream({
 *       delimiter: encoder.encode(";"),
 *       limit: 4,
 *     }),
 *   );
 *
 * assertEquals(
 *   await Array.fromAsync(readable),
 *   [
 *     { match: true, value: encoder.encode("foo") },
 *     { match: false, value: encoder.encode("beep") },
 *     { match: true, value: encoder.encode("s") },
 *     { match: true, value: encoder.encode("") },
 *     { match: true, value: encoder.encode("bar") },
 *     { match: true, value: encoder.encode("") },
 *   ],
 * );
 * ```
 */
export class CappedDelimiterStream
  implements TransformStream<Uint8Array, CappedDelimiterEntry> {
  #readable: ReadableStream<CappedDelimiterEntry>;
  #writable: WritableStream<Uint8Array>;
  /**
   * Constructs a new instance.
   *
   * @param options The options for the stream.
   */
  constructor(options: CappedDelimiterOptions) {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    this.#writable = writable;
    this.#readable = ReadableStream.from(this.#handle(readable, options));
  }

  async *#handle(
    readable: ReadableStream<Uint8Array>,
    { delimiter, limit }: CappedDelimiterOptions,
  ): AsyncGenerator<CappedDelimiterEntry> {
    const reader = toByteStream(readable).getReader({ mode: "byob" });
    let buffer = (await reader.read(
      new Uint8Array(limit + delimiter.length),
      { min: limit + delimiter.length },
    )).value!;

    a: while (true) {
      b: for (let i = 0; i <= buffer.length - delimiter.length; ++i) {
        for (let j = 0; j < delimiter.length; ++j) {
          if (buffer[i + j] !== delimiter[j]) continue b;
        }
        // Match
        yield { match: true, value: buffer.slice(0, i) };
        buffer.set(buffer.subarray(i + delimiter.length));
        buffer = buffer.subarray(-i - delimiter.length);
        buffer = (await reader.read(buffer, { min: buffer.length })).value!;
        buffer = new Uint8Array(
          buffer.buffer,
          0,
          buffer.byteOffset + buffer.byteLength,
        );
        continue a;
      }
      if (buffer.byteLength < buffer.buffer.byteLength) {
        // Finished
        while (buffer.length) {
          yield { match: false, value: buffer.slice(0, limit) };
          buffer = buffer.subarray(limit);
        }
        break;
      }
      yield { match: false, value: buffer.slice(0, -delimiter.length) };
      buffer.set(buffer.subarray(-delimiter.length));
      buffer = buffer.subarray(delimiter.length);
      buffer = (await reader.read(buffer, { min: buffer.length })).value!;
      buffer = new Uint8Array(
        buffer.buffer,
        0,
        buffer.byteOffset + buffer.byteLength,
      );
    }
  }

  /**
   * The ReadableStream.
   *
   * @return ReadableStream<CappedDelimiterEntry>
   *
   * @example Usage
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import {
   *   CappedDelimiterStream,
   * } from "@std/streams/unstable-capped-delimiter-stream";
   *
   * const encoder = new TextEncoder();
   *
   * const readable = ReadableStream.from(["foo;beeps;;bar;;"])
   *   .pipeThrough(new TextEncoderStream())
   *   .pipeThrough(
   *     new CappedDelimiterStream({
   *       delimiter: encoder.encode(";"),
   *       limit: 4,
   *     }),
   *   );
   *
   * assertEquals(
   *   await Array.fromAsync(readable),
   *   [
   *     { match: true, value: encoder.encode("foo") },
   *     { match: false, value: encoder.encode("beep") },
   *     { match: true, value: encoder.encode("s") },
   *     { match: true, value: encoder.encode("") },
   *     { match: true, value: encoder.encode("bar") },
   *     { match: true, value: encoder.encode("") },
   *   ],
   * );
   * ```
   */
  get readable(): ReadableStream<CappedDelimiterEntry> {
    return this.#readable;
  }

  /**
   * The WritableStream.
   *
   * @return WritableStream<Uint8Array>
   *
   * @example Usage
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import {
   *   CappedDelimiterStream,
   * } from "@std/streams/unstable-capped-delimiter-stream";
   *
   * const encoder = new TextEncoder();
   *
   * const readable = ReadableStream.from(["foo;beeps;;bar;;"])
   *   .pipeThrough(new TextEncoderStream())
   *   .pipeThrough(
   *     new CappedDelimiterStream({
   *       delimiter: encoder.encode(";"),
   *       limit: 4,
   *     }),
   *   );
   *
   * assertEquals(
   *   await Array.fromAsync(readable),
   *   [
   *     { match: true, value: encoder.encode("foo") },
   *     { match: false, value: encoder.encode("beep") },
   *     { match: true, value: encoder.encode("s") },
   *     { match: true, value: encoder.encode("") },
   *     { match: true, value: encoder.encode("bar") },
   *     { match: true, value: encoder.encode("") },
   *   ],
   * );
   * ```
   */
  get writable(): WritableStream<Uint8Array> {
    return this.#writable;
  }
}
