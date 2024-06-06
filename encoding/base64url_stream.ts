// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Utilities for encoding and decoding to and from base64url in a streaming manner.
 *
 * @module
 */

import { decodeBase64Url, encodeBase64Url } from "./base64url.ts";

/**
 * Converts a Uint8Array stream into a base64url-encoded stream.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-5}
 *
 * @example Usage
 * ```ts
 * import { Base64UrlEncoderStream } from "@std/encoding/base64url-stream";
 *
 * await (await Deno.open('./deno.json'))
 *   .readable
 *   .pipeThrough(new Base64UrlEncoderStream())
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeTo(Deno.stdout.writable, { preventClose: true });
 * ```
 */
export class Base64UrlEncoderStream
  extends TransformStream<Uint8Array, string> {
  constructor() {
    let push = new Uint8Array(0);
    super({
      transform(chunk, controller) {
        const concat = new Uint8Array(push.length + chunk.length);
        concat.set(push);
        concat.set(chunk, push.length);

        const remainder = -concat.length % 3;
        controller.enqueue(
          encodeBase64Url(concat.slice(0, remainder || undefined)),
        );
        push = remainder ? concat.slice(remainder) : new Uint8Array(0);
      },
      flush(controller) {
        if (push.length) {
          controller.enqueue(encodeBase64Url(push));
        }
      },
    });
  }
}

/**
 * Decodes a base64url-encoded stream into a Uint8Array stream.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-5}
 *
 * @example Usage
 * ```ts
 * import { Base64UrlDecoderStream, Base64UrlEncoderStream } from "@std/encoding/base64url-stream";
 *
 * await (await Deno.open('./deno.json'))
 *   .readable
 *   .pipeThrough(new Base64UrlEncoderStream())
 *   .pipeThrough(new Base64UrlDecoderStream())
 *   .pipeTo(Deno.stdout.writable, { preventClose: true });
 * ```
 */
export class Base64UrlDecoderStream
  extends TransformStream<string, Uint8Array> {
  constructor() {
    let push = "";
    super({
      transform(chunk, controller) {
        const remainder = -(push.length + chunk.length) % 4;
        controller.enqueue(
          decodeBase64Url(push + chunk.slice(0, remainder || undefined)),
        );
        push = remainder ? chunk.slice(remainder) : "";
      },
      flush(controller) {
        if (push.length) {
          controller.enqueue(decodeBase64Url(push));
        }
      },
    });
  }
}
