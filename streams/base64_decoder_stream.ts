// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

// Based on https://github.com/mazira/base64-stream

import { decodeBase64 } from "@std/encoding/base64";

/**
 * A transform stream that decodes a stream of base64-encoded strings.
 *
 * **Note**: This transform stream does not handle line breaks.
 *
 * @example
 * ```ts
 * import { Base64DecoderStream } from "@std/streams/base64-decoder-stream";
 *
 * const stream = ReadableStream.from([
 *   "aGVs",
 *   "bG8g",
 *   "d29y",
 *   "bGQ=",
 * ]);
 *
 * const decodedStream = stream.pipeThrough(new Base64DecoderStream());
 * ```
 */
export class Base64DecoderStream extends TransformStream<string, Uint8Array> {
  /** The remain data from the previous chunk. */
  #remain: string = "";

  /**
   * Constructs a new instance.
   */
  constructor() {
    super({
      transform: (chunk, controller) => {
        chunk = this.#remain + chunk;

        // Decode blocks of 4 characters which represent 3 bytes in base64 encoding.
        const remaining = chunk.length % 4;

        this.#remain = chunk.slice(chunk.length - remaining);
        chunk = chunk.slice(0, chunk.length - remaining);

        const output = decodeBase64(chunk);
        controller.enqueue(output);
      },

      // TODO(babiabeo): Do we actually need to decode the remaining characters?
      flush: (controller) => {
        if (this.#remain) {
          // Decode the remaining characters.
          const output = decodeBase64(this.#remain);
          controller.enqueue(output);
        }
      },
    });
  }
}
