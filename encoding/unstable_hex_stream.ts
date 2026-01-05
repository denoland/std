// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * TransformStream classes to encode and decode to and from hexadecimal data in a streaming manner.
 *
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeHex } from "@std/encoding/unstable-hex";
 * import { HexEncoderStream } from "@std/encoding/unstable-hex-stream";
 * import { toText } from "@std/streams";
 *
 * const readable = (await Deno.open("./deno.lock"))
 *   .readable
 *   .pipeThrough(new HexEncoderStream({ output: "string" }));
 *
 * assertEquals(
 *   await toText(readable),
 *   encodeHex(await Deno.readFile("./deno.lock")),
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
  alphabet,
  calcSizeHex,
  decode,
  encode,
  rAlphabet,
} from "./_common16.ts";
import { detach } from "./_common_detach.ts";

type Expect<T> = T extends "bytes" ? Uint8Array_ : string;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Transforms a {@linkcode Uint8Array<ArrayBuffer>} stream into a hexadecimal stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The type of the hexadecimal stream.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeHex } from "@std/encoding/unstable-hex";
 * import { HexEncoderStream } from "@std/encoding/unstable-hex-stream";
 * import { toText } from "@std/streams";
 *
 * const readable = (await Deno.open("./deno.lock"))
 *   .readable
 *   .pipeThrough(new HexEncoderStream({ output: "string" }));
 *
 * assertEquals(
 *   await toText(readable),
 *   encodeHex(await Deno.readFile("./deno.lock")),
 * );
 * ```
 */
export class HexEncoderStream<T extends "string" | "bytes">
  extends TransformStream<
    Uint8Array_,
    T extends "bytes" ? Uint8Array_ : string
  > {
  /**
   * Constructs a new instance.
   *
   * @param options The options for the hexadecimal stream.
   */
  constructor(options: { output?: T } = {}) {
    const decode = function (): (input: Uint8Array_) => Expect<T> {
      if (options.output === "bytes") return (x) => x as Expect<T>;
      return (x) => decoder.decode(x) as Expect<T>;
    }();
    super({
      transform(chunk, controller) {
        const [output, i] = detach(chunk, calcSizeHex(chunk.length));
        encode(output, i, 0, alphabet);
        controller.enqueue(decode(output));
      },
    });
  }
}

/**
 * Transforms a hexadecimal stream into a {@link Uint8Array<ArrayBuffer>} stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The type of the hexadecimal stream.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import {
 *   HexDecoderStream,
 *   HexEncoderStream,
 * } from "@std/encoding/unstable-hex-stream";
 * import { toBytes } from "@std/streams/unstable-to-bytes";
 *
 * const readable = (await Deno.open("./deno.lock"))
 *   .readable
 *   .pipeThrough(new HexEncoderStream({ output: "bytes" }))
 *   .pipeThrough(new HexDecoderStream({ input: "bytes" }));
 *
 * assertEquals(
 *   await toBytes(readable),
 *   await Deno.readFile("./deno.lock"),
 * );
 * ```
 */
export class HexDecoderStream<T extends "string" | "bytes">
  extends TransformStream<
    T extends "bytes" ? Uint8Array_ : string,
    Uint8Array_
  > {
  /**
   * Constructs a new instance.
   *
   * @param options The options of the hexadecimal stream.
   */
  constructor(options: { input?: T } = {}) {
    const encode = function (): (input: Expect<T>) => Uint8Array_ {
      if (options.input === "bytes") return (x) => x as Uint8Array_;
      return (x) => encoder.encode(x as string) as Uint8Array_;
    }();
    const push = new Uint8Array(1);
    let remainder = 0;
    super({
      transform(chunk, controller) {
        let output = encode(chunk);
        if (remainder) {
          output = detach(output, remainder + output.length)[0];
          output.set(push.subarray(0, remainder));
        }
        remainder = output.length % 2;
        if (remainder) push.set(output.subarray(-remainder));
        const o = decode(
          output.subarray(0, -remainder || undefined),
          0,
          0,
          rAlphabet,
        );
        controller.enqueue(output.subarray(0, o));
      },
      flush(controller) {
        if (remainder) {
          const o = decode(push.subarray(0, remainder), 0, 0, rAlphabet);
          controller.enqueue(push.subarray(0, o));
        }
      },
    });
  }
}
