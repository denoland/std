// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for encoding and decoding to and from base32hex in a streaming manner.
 *
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { Base32HexDecoderStream } from "@std/encoding/unstable-base32hex-stream";
 * import { toText } from "@std/streams/to-text";
 *
 * const stream = ReadableStream.from(["91IMOR3F5GG7ERRI", "DHI22==="])
 *   .pipeThrough(new Base32HexDecoderStream())
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
  calcMax,
  decodeRawBase32Hex as decode,
  encodeRawBase32Hex as encode,
} from "./unstable_base32hex.ts";
import { detach } from "./_common_detach.ts";

/**
 * Converts a Uint8Array stream into a base32hex-encoded stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-6}
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase32Hex } from "@std/encoding/unstable-base32hex";
 * import { Base32HexEncoderStream } from "@std/encoding/unstable-base32hex-stream";
 * import { toText } from "@std/streams/to-text";
 *
 * const stream = ReadableStream.from(["Hello,", " world!"])
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeThrough(new Base32HexEncoderStream());
 *
 * assertEquals(await toText(stream), encodeBase32Hex(new TextEncoder().encode("Hello, world!") as Uint8Array_));
 * ```
 */
export class Base32HexEncoderStream
  extends TransformStream<Uint8Array_, string> {
  constructor() {
    const decoder = new TextDecoder();
    const push = new Uint8Array(4);
    let remainder = 0;
    super({
      transform(chunk, controller) {
        let [output, i] = detach(chunk, calcMax(remainder + chunk.length));
        if (remainder) {
          i -= remainder;
          output.set(push.subarray(0, remainder), i);
        }
        remainder = (output.length - i) % 5;
        if (remainder) push.set(output.subarray(-remainder));
        controller.enqueue(
          decoder.decode(
            output.subarray(
              0,
              encode(output.subarray(0, -remainder || undefined), i, 0),
            ),
          ),
        );
      },
      flush(controller) {
        if (remainder) {
          const [output, i] = detach(
            push.subarray(0, remainder),
            calcMax(remainder),
          );
          encode(output, i, 0);
          controller.enqueue(decoder.decode(output));
        }
      },
    });
  }
}

/**
 * Decodes a base32hex-encoded stream into a Uint8Array stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-6}
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { Base32HexDecoderStream } from "@std/encoding/unstable-base32hex-stream";
 * import { toText } from "@std/streams/to-text";
 *
 * const stream = ReadableStream.from(["91IMOR3F5GG7ERRI", "DHI22==="])
 *   .pipeThrough(new Base32HexDecoderStream())
 *   .pipeThrough(new TextDecoderStream());
 *
 * assertEquals(await toText(stream), "Hello, world!");
 * ```
 */
export class Base32HexDecoderStream
  extends TransformStream<string, Uint8Array_> {
  constructor() {
    const encoder = new TextEncoder();
    const push = new Uint8Array(7);
    let remainder = 0;
    super({
      transform(chunk, controller) {
        let output = encoder.encode(chunk) as Uint8Array_;
        if (remainder) {
          output = detach(output, remainder + output.length)[0];
          output.set(push.subarray(0, remainder));
        }
        remainder = output.length % 8;
        if (remainder) push.set(output.subarray(-remainder));
        controller.enqueue(
          output.subarray(
            0,
            decode(output.subarray(0, -remainder || undefined), 0, 0),
          ),
        );
      },
      flush(controller) {
        if (remainder) {
          controller.enqueue(
            push.subarray(0, decode(push.subarray(0, remainder), 0, 0)),
          );
        }
      },
    });
  }
}
