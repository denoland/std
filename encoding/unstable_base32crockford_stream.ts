// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for encoding and decoding to and from base32crockford in a streaming manner.
 *
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { Base32CrockfordDecoderStream } from "@std/encoding/unstable-base32crockford-stream";
 * import { toText } from "@std/streams/to-text";
 *
 * const stream = ReadableStream.from(["91JPRV3F5GG7EVVJ", "DHJ22==="])
 *   .pipeThrough(new Base32CrockfordDecoderStream())
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
  decodeRawBase32Crockford as decode,
  encodeRawBase32Crockford as encode,
} from "./unstable_base32crockford.ts";

/**
 * Converts a Uint8Array stream into a base32crockford-encoded stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-6}
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase32Crockford } from "@std/encoding/unstable-base32crockford";
 * import { Base32CrockfordEncoderStream } from "@std/encoding/unstable-base32crockford-stream";
 * import { toText } from "@std/streams/to-text";
 *
 * const stream = ReadableStream.from(["Hello,", " world!"])
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeThrough(new Base32CrockfordEncoderStream());
 *
 * assertEquals(await toText(stream), encodeBase32Crockford(new TextEncoder().encode("Hello, world!") as Uint8Array_));
 * ```
 */
export class Base32CrockfordEncoderStream
  extends TransformStream<Uint8Array_, string> {
  constructor() {
    const decoder = new TextDecoder();
    const push = new Uint8Array(4);
    let remainder = 0;
    // let push = new Uint8Array(0);
    super({
      transform(chunk, controller) {
        if (remainder) {
          const originalSize = chunk.length;
          const maxSize = remainder + chunk.length;
          if (chunk.byteOffset) {
            const buffer = new Uint8Array(chunk.buffer);
            buffer.set(chunk);
            chunk = buffer.subarray(0, chunk.length);
          }
          chunk = new Uint8Array(chunk.buffer.transfer(maxSize));
          chunk.set(chunk.subarray(0, originalSize), maxSize - originalSize);
          chunk.set(push.subarray(0, remainder));
        }

        remainder = chunk.length % 5;
        if (remainder) push.set(chunk.subarray(-remainder));
        controller.enqueue(
          decoder.decode(encode(chunk.subarray(0, -remainder || undefined))),
        );
      },
      flush(controller) {
        if (remainder) {
          controller.enqueue(
            decoder.decode(encode(push.subarray(0, remainder))),
          );
        }
      },
    });
  }
}

/**
 * Decodes a base32crockford-encoded stream into a Uint8Array stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-6}
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { Base32CrockfordDecoderStream } from "@std/encoding/unstable-base32crockford-stream";
 * import { toText } from "@std/streams/to-text";
 *
 * const stream = ReadableStream.from(["91JPRV3F5GG7EVVJ", "DHJ22==="])
 *   .pipeThrough(new Base32CrockfordDecoderStream())
 *   .pipeThrough(new TextDecoderStream());
 *
 * assertEquals(await toText(stream), "Hello, world!");
 * ```
 */
export class Base32CrockfordDecoderStream
  extends TransformStream<string, Uint8Array_> {
  constructor() {
    const encoder = new TextEncoder();
    const push = new Uint8Array(7);
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

        remainder = input.length % 8;
        if (remainder) push.set(input.subarray(-remainder));
        controller.enqueue(decode(input.subarray(0, -remainder || undefined)));
      },
      flush(controller) {
        if (remainder) {
          controller.enqueue(decode(push.subarray(0, remainder)));
        }
      },
    });
  }
}
