// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { assert } from "@std/assert/assert";

/**
 * A transform stream that only transforms from the zero-indexed `start` and
 * `end` bytes (both inclusive).
 *
 * @example
 * ```ts
 * import { ByteSliceStream } from "@std/streams/byte-slice-stream";
 *
 * const response = await fetch("https://example.com");
 * const rangedStream = response.body!
 *   .pipeThrough(new ByteSliceStream(3, 8));
 * ```
 */
export class ByteSliceStream extends TransformStream<Uint8Array, Uint8Array> {
  #offsetStart = 0;
  #offsetEnd = 0;

  /** Constructs a new instance. */
  constructor(start = 0, end: number = Infinity) {
    super({
      start: () => {
        assert(start >= 0, "`start` must be greater than 0");
        end += 1;
      },
      transform: (chunk, controller) => {
        this.#offsetStart = this.#offsetEnd;
        this.#offsetEnd += chunk.byteLength;
        if (this.#offsetEnd > start) {
          if (this.#offsetStart < start) {
            chunk = chunk.slice(start - this.#offsetStart);
          }
          if (this.#offsetEnd >= end) {
            chunk = chunk.slice(0, chunk.byteLength - this.#offsetEnd + end);
            controller.enqueue(chunk);
            controller.terminate();
          } else {
            controller.enqueue(chunk);
          }
        }
      },
    });
  }
}
