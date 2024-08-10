// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Utilities for encoding and decoding to and from base32hex in a streaming manner.
 *
 * @module
 */

import { decodeBase32Hex, encodeBase32Hex } from "./base32hex.ts";

/**
 * Converts a Uint8Array stream into a base32hex-encoded stream.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-6}
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase32Hex } from "@std/encoding/base32hex";
 * import { Base32HexEncoderStream } from "@std/encoding/base32hex-stream";
 *
 * assertEquals(
 *   (await Array.fromAsync(
 *     (await Deno.open("./deno.json"))
 *       .readable
 *       .pipeThrough(new Base32HexEncoderStream()),
 *   )).join(""),
 *   encodeBase32Hex(await Deno.readFile("./deno.json")),
 * );
 * ```
 */
export class Base32HexEncoderStream
  extends TransformStream<Uint8Array, string> {
  constructor() {
    let push = new Uint8Array(0);
    super({
      transform(chunk, controller) {
        const concat = new Uint8Array(push.length + chunk.length);
        concat.set(push);
        concat.set(chunk, push.length);

        const remainder = -concat.length % 5;
        controller.enqueue(
          encodeBase32Hex(concat.slice(0, remainder || undefined)),
        );
        push = remainder ? concat.slice(remainder) : new Uint8Array(0);
      },
      flush(controller) {
        if (push.length) {
          controller.enqueue(encodeBase32Hex(push));
        }
      },
    });
  }
}

/**
 * Decodes a base32hex-encoded stream into a Uint8Array stream.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-6}
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { Base32HexDecoderStream, Base32HexEncoderStream } from "@std/encoding/base32hex-stream";
 *
 * const readable = (await Deno.open("./deno.json"))
 *   .readable
 *   .pipeThrough(new Base32HexEncoderStream());
 *
 * assertEquals(
 *   Uint8Array.from((await Array.fromAsync(
 *     readable.pipeThrough(new Base32HexDecoderStream()),
 *   )).map(x => [...x]).flat()),
 *   await Deno.readFile("./deno.json"),
 * );
 * ```
 */
export class Base32HexDecoderStream
  extends TransformStream<string, Uint8Array> {
  constructor() {
    let push = "";
    super({
      transform(chunk, controller) {
        push += chunk;
        if (push.length < 8) {
          return;
        }
        const remainder = -push.length % 8;
        controller.enqueue(
          decodeBase32Hex(push.slice(0, remainder || undefined)),
        );
        push = remainder ? chunk.slice(remainder) : "";
      },
      flush(controller) {
        if (push.length) {
          controller.enqueue(decodeBase32Hex(push));
        }
      },
    });
  }
}
