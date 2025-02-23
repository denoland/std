// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for encoding and decoding to and from hex in a streaming manner.
 *
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { HexDecoderStream } from "@std/encoding/unstable-hex-stream";
 * import { toText } from "@std/streams/to-text";
 *
 * const stream = ReadableStream.from(["48656c6c6f2c", "20776f726c6421"])
 *   .pipeThrough(new HexDecoderStream())
 *   .pipeThrough(new TextDecoderStream());
 *
 * assertEquals(await toText(stream), "Hello, world!");
 * ```
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import {
  decodeRawHex as decode,
  encodeRawHex as encode,
} from "./unstable_hex.ts";

/**
 * Converts a Uint8Array stream into a hex-encoded stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-8}
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeHex } from "@std/encoding/hex";
 * import { HexEncoderStream } from "@std/encoding/unstable-hex-stream";
 * import { toText } from "@std/streams/to-text";
 *
 * const stream = ReadableStream.from(["Hello,", " world!"])
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeThrough(new HexEncoderStream());
 *
 * assertEquals(await toText(stream), encodeHex(new TextEncoder().encode("Hello, world!")));
 * ```
 */
export class HexEncoderStream extends TransformStream<Uint8Array_, string> {
  constructor() {
    const decoder = new TextDecoder();
    super({
      transform(chunk, controller) {
        controller.enqueue(decoder.decode(encode(chunk)));
      },
    });
  }
}

/**
 * Decodes a hex-encoded stream into a Uint8Array stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-8}
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { HexDecoderStream } from "@std/encoding/unstable-hex-stream";
 * import { toText } from "@std/streams/to-text";
 *
 * const stream = ReadableStream.from(["48656c6c6f2c", "20776f726c6421"])
 *   .pipeThrough(new HexDecoderStream())
 *   .pipeThrough(new TextDecoderStream());
 *
 * assertEquals(await toText(stream), "Hello, world!");
 * ```
 */
export class HexDecoderStream extends TransformStream<string, Uint8Array_> {
  constructor() {
    const encoder = new TextEncoder();
    const push = new Uint8Array(1);
    let remainder = 0;
    super({
      transform(chunk, controller) {
        let input = encoder.encode(chunk) as Uint8Array_;
        if (remainder) {
          const originalSize = input.length;
          const maxSize = remainder + input.length;
          input = new Uint8Array(input.buffer.transfer(maxSize));
          input.set(input.subarray(0, originalSize), maxSize - originalSize);
          input.set(push.subarray(0, remainder));
        }

        remainder = input.length % 2;
        if (remainder) push.set(input.subarray(-remainder));
        controller.enqueue(decode(input.subarray(0, -remainder || undefined)));
      },
      flush(controller) {
        if (remainder) {
          controller.enqueue(encode(push.subarray(0, remainder)));
        }
      },
    });
  }
}
