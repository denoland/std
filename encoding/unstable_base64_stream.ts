// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * TransformStream classes to encode and decode to and from base64 data in a streaming manner.
 *
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase64 } from "@std/encoding/unstable-base64";
 * import { Base64EncoderStream } from "@std/encoding/unstable-base64-stream";
 * import { toText } from "@std/streams";
 *
 * const readable = (await Deno.open("./deno.lock"))
 *   .readable
 *   .pipeThrough(new Base64EncoderStream({ output: "string" }));
 *
 * assertEquals(
 *   await toText(readable),
 *   encodeBase64(await Deno.readFile("./deno.lock"), "Base64"),
 * );
 * ```
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import {
  type Base64Format,
  calcMax,
  decodeRawBase64 as decode,
  encodeRawBase64 as encode,
} from "./unstable_base64.ts";
import { detach } from "./_common_detach.ts";

/**
 * A type used to represent the expected type of a base64 stream.
 */
type Expect<T> = T extends "bytes" ? Uint8Array_ : string;

/**
 * Transforms a {@linkcode Uint8Array<ArrayBuffer>} stream into a base64 stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The type of the base64 stream.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase64 } from "@std/encoding/unstable-base64";
 * import { Base64EncoderStream } from "@std/encoding/unstable-base64-stream";
 * import { toText } from "@std/streams";
 *
 * const readable = (await Deno.open("./deno.lock"))
 *   .readable
 *   .pipeThrough(new Base64EncoderStream({ output: "string" }));
 *
 * assertEquals(
 *   await toText(readable),
 *   encodeBase64(await Deno.readFile("./deno.lock")),
 * );
 * ```
 */
export class Base64EncoderStream<T extends "string" | "bytes">
  extends TransformStream<
    Uint8Array_,
    T extends "bytes" ? Uint8Array_ : string
  > {
  /**
   * Constructs a new instance.
   *
   * @param options The options for the base64 stream.
   */
  constructor(options: { format?: Base64Format; output?: T } = {}) {
    const decode = function (): (input: Uint8Array_) => Expect<T> {
      if (options.output === "bytes") return (x) => x as Expect<T>;
      const decoder = new TextDecoder();
      return (x) => decoder.decode(x) as Expect<T>;
    }();
    const push = new Uint8Array(2);
    let remainder = 0;
    super({
      transform(chunk, controller) {
        let [output, i] = detach(chunk, calcMax(remainder + chunk.length));
        if (remainder) {
          i -= remainder;
          output.set(push.subarray(0, remainder), i);
        }
        remainder = (output.length - i) % 3;
        if (remainder) push.set(output.subarray(-remainder));
        const o = encode(
          output.subarray(0, -remainder || undefined),
          i,
          0,
          options.format,
        );
        controller.enqueue(decode(output.subarray(0, o)));
      },
      flush(controller) {
        if (remainder) {
          const [output, i] = detach(
            push.subarray(0, remainder),
            calcMax(remainder),
          );
          const o = encode(output, i, 0, options.format);
          controller.enqueue(decode(output.subarray(0, o)));
        }
      },
    });
  }
}

/**
 * Transforms a base64 stream into a {@link Uint8Array<ArrayBuffer>} stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The type of the base64 stream.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import {
 *   Base64DecoderStream,
 *   Base64EncoderStream,
 * } from "@std/encoding/unstable-base64-stream";
 * import { toBytes } from "@std/streams/unstable-to-bytes";
 *
 * const readable = (await Deno.open("./deno.lock"))
 *   .readable
 *   .pipeThrough(new Base64EncoderStream({ output: "string" }))
 *   .pipeThrough(new Base64DecoderStream({ input: "string" }));
 *
 * assertEquals(
 *   await toBytes(readable),
 *   await Deno.readFile("./deno.lock"),
 * );
 * ```
 */
export class Base64DecoderStream<T extends "string" | "bytes">
  extends TransformStream<
    T extends "bytes" ? Uint8Array_ : string,
    Uint8Array_
  > {
  /**
   * Constructs a new instance.
   *
   * @param options The options for the base64 stream.
   */
  constructor(options: { format?: Base64Format; input?: T } = {}) {
    const encode = function (): (input: Expect<T>) => Uint8Array_ {
      if (options.input === "bytes") return (x) => x as Uint8Array_;
      const encoder = new TextEncoder();
      return (x) => encoder.encode(x as string) as Uint8Array_;
    }();
    const push = new Uint8Array(3);
    let remainder = 0;
    super({
      transform(chunk, controller) {
        let output = encode(chunk);
        if (remainder) {
          output = detach(output, remainder + output.length)[0];
          output.set(push.subarray(0, remainder));
        }
        remainder = output.length % 4;
        if (remainder) push.set(output.subarray(-remainder));
        const o = decode(
          output.subarray(0, -remainder || undefined),
          0,
          0,
          options.format,
        );
        controller.enqueue(output.subarray(0, o));
      },
      flush(controller) {
        if (remainder) {
          const o = decode(
            push.subarray(0, remainder),
            0,
            0,
            options.format,
          );
          controller.enqueue(push.subarray(0, o));
        }
      },
    });
  }
}
