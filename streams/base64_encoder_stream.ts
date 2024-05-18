// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

// Based on https://github.com/mazira/base64-stream

import { concat } from "@std/bytes";
import { encodeBase64 } from "@std/encoding/base64";

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

  /**
   * Constructs a new instance.
   */
  constructor() {
    super({
      transform: (chunk, controller) => {
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
        controller.enqueue(output);
      },

      flush: (controller) => {
        if (this.#remain) {
          const output = encodeBase64(this.#remain);
          controller.enqueue(output);
        }
      },
    });
  }
}
