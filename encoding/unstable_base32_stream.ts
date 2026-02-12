// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * TransformStream classes to encode and decode to and from base32 data in a streaming manner.
 *
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase32 } from "@std/encoding/unstable-base32";
 * import { Base32EncoderStream } from "@std/encoding/unstable-base32-stream";
 * import { toText } from "@std/streams";
 *
 * const readable = (await Deno.open("./deno.lock"))
 *   .readable
 *   .pipeThrough(new Base32EncoderStream({ output: "string" }));
 *
 * assertEquals(
 *   await toText(readable),
 *   encodeBase32(await Deno.readFile("./deno.lock"), { alphabet: "base32" }),
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
  type Base32Alphabet,
  calcSizeBase32,
  decode,
  encode,
  padding,
  rAlphabet,
} from "./_common32.ts";
import { detach } from "./_common_detach.ts";

type Expect<T> = T extends "bytes" ? Uint8Array_ : string;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Transforms a {@linkcode Uint8Array<ArrayBuffer>} stream into a base32 stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The type of the base32 stream.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase32 } from "@std/encoding/unstable-base32";
 * import { Base32EncoderStream } from "@std/encoding/unstable-base32-stream";
 * import { toText } from "@std/streams";
 *
 * const readable = (await Deno.open("./deno.lock"))
 *   .readable
 *   .pipeThrough(new Base32EncoderStream({ output: "string" }));
 *
 * assertEquals(
 *   await toText(readable),
 *   encodeBase32(await Deno.readFile("./deno.lock"), { alphabet: "base32" }),
 * );
 * ```
 */
export class Base32EncoderStream<T extends "string" | "bytes">
  extends TransformStream<
    Uint8Array_,
    T extends "bytes" ? Uint8Array_ : string
  > {
  /**
   * Constructs a new instance.
   *
   * @param options The options of the base32 stream.
   */
  constructor(options: { alphabet?: Base32Alphabet; output?: T } = {}) {
    const abc = alphabet[options.alphabet ?? "base32"];
    const decode = function (): (input: Uint8Array_) => Expect<T> {
      if (options.output === "bytes") return (x) => x as Expect<T>;
      return (x) => decoder.decode(x) as Expect<T>;
    }();
    const push = new Uint8Array(4);
    let remainder = 0;
    super({
      transform(chunk, controller) {
        let [output, i] = detach(
          chunk,
          calcSizeBase32(remainder + chunk.length),
        );
        if (remainder) {
          i -= remainder;
          output.set(push.subarray(0, remainder), i);
        }
        remainder = (output.length - i) % 5;
        if (remainder) push.set(output.subarray(-remainder));
        const o = encode(
          output.subarray(0, -remainder || undefined),
          i,
          0,
          abc,
          padding,
        );
        controller.enqueue(decode(output.subarray(0, o)));
      },
      flush(controller) {
        if (remainder) {
          const [output, i] = detach(
            push.subarray(0, remainder),
            calcSizeBase32(remainder),
          );
          encode(output, i, 0, abc, padding);
          controller.enqueue(decode(output));
        }
      },
    });
  }
}

/**
 * Transforms a base32 stream into a {@link Uint8Array<ArrayBuffer>} stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The type of the base32 stream.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import {
 *   Base32DecoderStream,
 *   Base32EncoderStream,
 * } from "@std/encoding/unstable-base32-stream";
 * import { toBytes } from "@std/streams/unstable-to-bytes";
 *
 * const readable = (await Deno.open("./deno.lock"))
 *   .readable
 *   .pipeThrough(new Base32EncoderStream({ output: "string" }))
 *   .pipeThrough(new Base32DecoderStream({ input: "string" }));
 *
 * assertEquals(
 *   await toBytes(readable),
 *   await Deno.readFile("./deno.lock"),
 * );
 * ```
 *
 * @module
 */
export class Base32DecoderStream<T extends "string" | "bytes">
  extends TransformStream<
    T extends "bytes" ? Uint8Array_ : string,
    Uint8Array_
  > {
  /**
   * Constructs a new instance.
   *
   * @param options The options of the base32 stream.
   */
  constructor(options: { alphabet?: Base32Alphabet; input?: T } = {}) {
    const abc = rAlphabet[options.alphabet ?? "base32"];
    const encode = function (): (input: Expect<T>) => Uint8Array_ {
      if (options.input === "bytes") return (x) => x as Uint8Array_;
      return (x) => encoder.encode(x as string) as Uint8Array_;
    }();
    const push = new Uint8Array(7);
    let remainder = 0;
    super({
      transform(chunk, controller) {
        let output = encode(chunk);
        if (remainder) {
          output = detach(output, remainder + output.length)[0];
          output.set(push.subarray(0, remainder));
        }
        remainder = output.length % 8;
        if (remainder) push.set(output.subarray(-remainder));
        const o = decode(
          output.subarray(0, -remainder || undefined),
          0,
          0,
          abc,
          padding,
        );
        controller.enqueue(output.subarray(0, o));
      },
      flush(controller) {
        if (remainder) {
          const o = decode(
            push.subarray(0, remainder),
            0,
            0,
            abc,
            padding,
          );
          controller.enqueue(push.subarray(0, o));
        }
      },
    });
  }
}
