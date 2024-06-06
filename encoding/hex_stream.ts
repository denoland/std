// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Utilities for encoding and decoding to and from hex in a streaming manner.
 *
 * @module
 */

import { decodeHex, encodeHex } from "./hex.ts";

/**
 * Converts a Uint8Array stream into a hex-encoded stream.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-8}
 *
 * @example Usage
 * ```ts
 * import { HexEncoderStream } from "@std/encoding/hex-stream";
 *
 * await (await Deno.open('./deno.json'))
 *   .readable
 *   .pipeThrough(new HexEncoderStream())
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeTo(Deno.stdout.writable, { preventClose: true });
 * ```
 */
export class HexEncoderStream extends TransformStream<Uint8Array, string> {
  constructor() {
    super({
      transform(chunk, controller) {
        controller.enqueue(encodeHex(chunk));
      },
    });
  }
}

/**
 * Decodes a hex-encoded stream into a Uint8Array stream.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-8}
 *
 * @example Usage
 * ```ts
 * import { HexDecoderStream, HexEncoderStream } from "@std/encoding/hex-stream";
 *
 * await (await Deno.open('./deno.json'))
 *   .readable
 *   .pipeThrough(new HexEncoderStream())
 *   .pipeThrough(new HexDecoderStream())
 *   .pipeTo(Deno.stdout.writable, { preventClose: true });
 * ```
 */
export class HexDecoderStream extends TransformStream<string, Uint8Array> {
  constructor() {
    let push = "";
    super({
      transform(chunk, controller) {
        const remainder = -(push.length + chunk.length) % 2;
        controller.enqueue(
          decodeHex(push + chunk.slice(0, remainder || undefined)),
        );
        push = remainder ? chunk.slice(remainder) : "";
      },
      flush(controller) {
        if (push.length) {
          controller.enqueue(decodeHex(push));
        }
      },
    });
  }
}
