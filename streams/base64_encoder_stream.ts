// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

// Based on https://github.com/mazira/base64-stream

import { concat } from "@std/bytes";
import { encodeBase64 } from "@std/encoding/base64";

/** Options for {@linkcode Base64EncoderStream}. */
export interface Base64EncoderStreamOptions {
  /**
   * The maximum length of the base64-encoded output lines.
   * If specified, the output will be split into lines of at most this length.
   */
  lineLength?: number;
}

/**
 * A transform stream that converts a stream of binary data into a base64-encoded stream.
 *
 * @example
 * ```ts
 * import { Base64EncoderStream } from "@std/streams/base64-encoder-stream";
 *
 * const response = await fetch("https://example.com");
 * const encodedStream = response.body!
 *  .pipeThrough(new Base64EncoderStream());
 * ```
 */
export class Base64EncoderStream extends TransformStream<Uint8Array, string> {
  /** The remain data from the previous chunk. */
  #remain: Uint8Array | null = null;
  /** The current line length. */
  #currentLength: number = 0;
  #lineLength: number = 0;

  constructor(options: Base64EncoderStreamOptions = {}) {
    super({
      transform: (chunk, controller) => this.#handle(chunk, controller),
      flush: (controller) => this.#flush(controller),
    });

    if (
      options.lineLength &&
      (!Number.isInteger(options.lineLength) || options.lineLength < 0)
    ) {
      throw new RangeError(
        `The "lineLength" option cannot be a negative integer.`,
      );
    }

    this.#lineLength = options.lineLength ?? 0;
  }

  #handle(
    chunk: Uint8Array,
    controller: TransformStreamDefaultController<string>,
  ) {
    if (this.#remain) {
      chunk = concat([this.#remain, chunk]);
      this.#remain = null;
    }

    // Encode blocks of 3 bytes which are represented by 4 characters in base64 encoding.
    const remaining = chunk.byteLength % 3;

    if (remaining) {
      this.#remain = chunk.slice(chunk.byteLength - remaining);
      chunk = chunk.slice(0, chunk.byteLength - remaining);
    }

    const output = encodeBase64(chunk);
    controller.enqueue(this.#fixLine(output));
  }

  #flush(controller: TransformStreamDefaultController<string>) {
    // Encode the remaining bytes.
    if (this.#remain) {
      const output = encodeBase64(this.#remain);
      controller.enqueue(this.#fixLine(output));
    }
  }

  /** Splits the chunk into lines of the specified length. */
  #fixLine(chunk: string) {
    if (!this.#lineLength) {
      return chunk;
    }

    const len = chunk.length;
    const needed = this.#lineLength - this.#currentLength;

    let start;
    let end;

    let output = "";
    for (
      start = 0, end = needed;
      end < len;
      start = end, end += this.#lineLength
    ) {
      output += chunk.slice(start, end);
      output += "\r\n";
    }

    const left = chunk.slice(start);
    this.#currentLength = left.length;

    output += left;
    return output;
  }
}
