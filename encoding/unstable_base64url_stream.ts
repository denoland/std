// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for encoding and decoding to and from base64url in a streaming manner.
 *
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { Base64UrlDecoderStream } from "@std/encoding/unstable-base64url-stream";
 * import { toText } from "@std/streams/to-text";
 *
 * const stream = ReadableStream.from(["SGVsbG8s", "IHdvcmxkIQ"])
 *   .pipeThrough(new Base64UrlDecoderStream())
 *   .pipeThrough(new TextDecoderStream());
 *
 * assertEquals(await toText(stream), "Hello, world!");
 * ```
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

import {
  decodeRawBase64Url as decode,
  encodeRawBase64Url as encode,
} from "./unstable_base64url.ts";

/**
 * Converts a Uint8Array stream into a base64url-encoded stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-5}
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase64Url } from "@std/encoding/base64url";
 * import { Base64UrlEncoderStream } from "@std/encoding/unstable-base64url-stream";
 * import { toText } from "@std/streams/to-text";
 *
 * const stream = ReadableStream.from(["Hello,", " world!"])
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeThrough(new Base64UrlEncoderStream());
 *
 * assertEquals(await toText(stream), encodeBase64Url(new TextEncoder().encode("Hello, world!")));
 * ```
 */
export class Base64UrlEncoderStream
  extends TransformStream<Uint8Array<ArrayBuffer>, string> {
  constructor() {
    const decoder = new TextDecoder();
    const push = new Uint8Array(2);
    let remainder = 0;
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

        remainder = chunk.length % 3;
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
 * Decodes a base64url-encoded stream into a Uint8Array stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-5}
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase64Url } from "@std/encoding/base64url";
 * import { Base64UrlDecoderStream } from "@std/encoding/unstable-base64url-stream";
 * import { toText } from "@std/streams/to-text";
 *
 * const stream = ReadableStream.from(["SGVsbG8s", "IHdvcmxkIQ"])
 *   .pipeThrough(new Base64UrlDecoderStream())
 *   .pipeThrough(new TextDecoderStream());
 *
 * assertEquals(await toText(stream), "Hello, world!");
 * ```
 */
export class Base64UrlDecoderStream
  extends TransformStream<string, Uint8Array<ArrayBuffer>> {
  constructor() {
    const encoder = new TextEncoder();
    const push = new Uint8Array(3);
    let remainder = 0;
    super({
      transform(chunk, controller) {
        let input = encoder.encode(chunk) as Uint8Array<ArrayBuffer>;
        if (remainder) {
          const originalSize = input.length;
          const maxSize = remainder + input.length;
          input = new Uint8Array(input.buffer.transfer(maxSize));
          input.set(input.subarray(0, originalSize), maxSize - originalSize);
          input.set(push.subarray(0, remainder));
        }

        remainder = input.length % 4;
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
