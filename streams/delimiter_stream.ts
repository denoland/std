// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/** Disposition of the delimiter for {@linkcode DelimiterStreamOptions}. */
export type DelimiterDisposition =
  /** Include delimiter in the found chunk. */
  | "suffix"
  /** Include delimiter in the subsequent chunk. */
  | "prefix"
  /** Discard the delimiter. */
  | "discard" // delimiter discarded
;

/** Options for {@linkcode DelimiterStream}. */
export interface DelimiterStreamOptions {
  /**
   * Disposition of the delimiter.
   *
   * @default {"discard"}
   */
  disposition?: DelimiterDisposition;
}

/**
 * Divide a stream into chunks delimited by a given byte sequence.
 *
 * If you are working with a stream of `string`, consider using {@linkcode TextDelimiterStream}.
 *
 * @example
 * Divide a CSV stream by commas, discarding the commas:
 * ```ts
 * import { DelimiterStream } from "@std/streams/delimiter-stream";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const inputStream = ReadableStream.from(["foo,bar", ",baz"]);
 *
 * const transformed = inputStream.pipeThrough(new TextEncoderStream())
 *   .pipeThrough(new DelimiterStream(new TextEncoder().encode(",")))
 *   .pipeThrough(new TextDecoderStream());
 *
 * assertEquals(await Array.fromAsync(transformed), ["foo", "bar", "baz"]);
 * ```
 *
 * @example
 * Divide a stream after semi-colons, keeping the semicolons in the output:
 * ```ts
 * import { DelimiterStream } from "@std/streams/delimiter-stream";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const inputStream = ReadableStream.from(["foo;", "bar;baz", ";"]);
 *
 * const transformed = inputStream.pipeThrough(new TextEncoderStream())
 *   .pipeThrough(
 *     new DelimiterStream(new TextEncoder().encode(";"), {
 *       disposition: "suffix",
 *     }),
 *   ).pipeThrough(new TextDecoderStream());
 *
 * assertEquals(await Array.fromAsync(transformed), ["foo;", "bar;", "baz;"]);
 * ```
 */
export class DelimiterStream extends TransformStream<Uint8Array, Uint8Array> {
  /**
   * Constructs a new instance.
   *
   * @param delimiter A delimiter to split the stream by.
   * @param options Options for the delimiter stream.
   *
   * @example comma as a delimiter
   * ```ts no-assert
   * import { DelimiterStream } from "@std/streams/delimiter-stream";
   *
   * const delimiterStream = new DelimiterStream(new TextEncoder().encode(","));
   * ```
   *
   * @example semicolon as a delimiter, and disposition set to `"suffix"`
   * ```ts no-assert
   * import { DelimiterStream } from "@std/streams/delimiter-stream";
   *
   * const delimiterStream = new DelimiterStream(new TextEncoder().encode(";"), {
   *   disposition: "suffix",
   * });
   * ```
   */
  constructor(
    delimiter: Uint8Array,
    options?: DelimiterStreamOptions,
  ) {
    let buffer = new Uint8Array(0);
    let chunkIndex = 0;
    let delimiterIndex = 0;
    super({
      transform(chunk, controller) {
        const concat = new Uint8Array(buffer.length + chunk.length);
        concat.set(buffer);
        concat.set(chunk, buffer.length);
        chunk = concat;

        while (chunkIndex < chunk.length) {
          if (chunk[chunkIndex] === delimiter[delimiterIndex]) {
            ++delimiterIndex;
            ++chunkIndex;
          } else {
            chunkIndex -= delimiterIndex - 1;
            delimiterIndex = 0;
          }
          if (delimiter.length == delimiterIndex) {
            // If suffix, don't exclude the end delimiter from enqueuing.
            controller.enqueue(
              chunk.slice(
                0,
                chunkIndex -
                  (options?.disposition === "suffix" ? 0 : delimiterIndex),
              ),
            );
            // If prefix, include the end delimiter in the remaining chunk.
            chunk = chunk.slice(
              chunkIndex -
                (options?.disposition === "prefix" ? delimiterIndex : 0),
            );
            // If prefix, skip checking the first delimiter.length to avoid an infinite loop of enqueuing `new Uint8Array(0)`.
            chunkIndex = options?.disposition === "prefix" ? delimiterIndex : 0;
            delimiterIndex = 0;
          }
        }
        buffer = chunk;
      },
      flush(controller) {
        controller.enqueue(buffer);
      },
    });
  }
}
