// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utilities for
 * {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-4 | base64}
 * encoding and decoding.
 *
 * This module is browser compatible.
 *
 * ```ts
 * import {
 *   encodeBase64,
 *   decodeBase64,
 * } from "@std/encoding/base64";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const foobar = new TextEncoder().encode("foobar");
 *
 * assertEquals(encodeBase64(foobar), "Zm9vYmFy");
 * assertEquals(decodeBase64("Zm9vYmFy"), foobar);
 * ```
 *
 * @module
 */

import { validateBinaryLike } from "./_util.ts";

const base64abc = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "+",
  "/",
];

/**
 * Converts data into a base64-encoded string.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-4}
 *
 * @param data The data to encode.
 * @returns The base64-encoded string.
 *
 * @example Usage
 * ```ts
 * import { encodeBase64 } from "@std/encoding/base64";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * assertEquals(encodeBase64("foobar"), "Zm9vYmFy");
 * ```
 */
export function encodeBase64(data: ArrayBuffer | Uint8Array | string): string {
  // CREDIT: https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727
  const uint8 = validateBinaryLike(data);
  let result = "";
  let i;
  const l = uint8.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[(uint8[i - 2]!) >> 2];
    result += base64abc[
      (((uint8[i - 2]!) & 0x03) << 4) |
      ((uint8[i - 1]!) >> 4)
    ];
    result += base64abc[
      (((uint8[i - 1]!) & 0x0f) << 2) |
      ((uint8[i]!) >> 6)
    ];
    result += base64abc[(uint8[i]!) & 0x3f];
  }
  if (i === l + 1) {
    // 1 octet yet to write
    result += base64abc[(uint8[i - 2]!) >> 2];
    result += base64abc[((uint8[i - 2]!) & 0x03) << 4];
    result += "==";
  }
  if (i === l) {
    // 2 octets yet to write
    result += base64abc[(uint8[i - 2]!) >> 2];
    result += base64abc[
      (((uint8[i - 2]!) & 0x03) << 4) |
      ((uint8[i - 1]!) >> 4)
    ];
    result += base64abc[((uint8[i - 1]!) & 0x0f) << 2];
    result += "=";
  }
  return result;
}

/**
 * Decodes a base64-encoded string.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-4}
 *
 * @param b64 The base64-encoded string to decode.
 * @returns The decoded data.
 *
 * @example Usage
 * ```ts
 * import { decodeBase64 } from "@std/encoding/base64";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * assertEquals(
 *   decodeBase64("Zm9vYmFy"),
 *   new TextEncoder().encode("foobar")
 * );
 * ```
 */
export function decodeBase64(b64: string): Uint8Array {
  const binString = atob(b64);
  const size = binString.length;
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts a Uint8Array stream into a base64-encoded stream.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-4}
 *
 * @example Usage
 * ```ts
 * import { Base64EncoderStream } from "@std/encoding/base64";
 *
 * await (await Deno.open('./deno.json'))
 *   .readable
 *   .pipeThrough(new Base64EncoderStream())
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeTo(Deno.stdout.writable, { preventClose: true });
 * ```
 */
export class Base64EncoderStream extends TransformStream<Uint8Array, string> {
  constructor() {
    let push = new Uint8Array(0);
    super({
      transform(chunk, controller) {
        const concat = new Uint8Array(push.length + chunk.length);
        concat.set(push);
        concat.set(chunk, push.length);

        const remainder = -concat.length % 3;
        controller.enqueue(
          encodeBase64(concat.slice(0, remainder || undefined)),
        );
        push = remainder ? concat.slice(remainder) : new Uint8Array(0);
      },
      flush(controller) {
        if (push.length) {
          controller.enqueue(encodeBase64(push));
        }
      },
    });
  }
}

/**
 * Decodes a base64-encoded stream into a Uint8Array stream.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-4}
 *
 * @example Usage
 * ```ts
 * import { Base64DecoderStream, Base64EncoderStream } from "@std/encoding/base64";
 *
 * await (await Deno.open('./deno.json'))
 *   .readable
 *   .pipeThrough(new Base64EncoderStream())
 *   .pipeThrough(new Base64DecoderStream())
 *   .pipeTo(Deno.stdout.writable, { preventClose: true });
 * ```
 */
export class Base64DecoderStream extends TransformStream<string, Uint8Array> {
  constructor() {
    let push = "";
    super({
      transform(chunk, controller) {
        const remainder = -(push.length + chunk.length) % 4;
        controller.enqueue(
          decodeBase64(push + chunk.slice(0, remainder || undefined)),
        );
        push = remainder ? chunk.slice(remainder) : "";
      },
      flush(controller) {
        if (push.length) {
          controller.enqueue(decodeBase64(push));
        }
      },
    });
  }
}
