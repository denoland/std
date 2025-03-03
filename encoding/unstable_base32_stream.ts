// Copyright 2018-2025 the Deno authors. MIT license.
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
 *   .pipeThrough(new Base32EncoderStream("Base32"));
 *
 * assertEquals(
 *   await toText(readable),
 *   encodeBase32(await Deno.readFile("./deno.lock"), "Base32"),
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
  type Base32Format,
  calcMax,
  decodeRawBase32 as decode,
  encodeRawBase32 as encode,
} from "./unstable_base32.ts";
import { detach } from "./_common_detach.ts";

/**
 * The raw base32 encoding formats.
 */
export type Base32RawFormat = `Raw-${Base32Format}`;
/**
 * A type used to represent the expected output of a base32 stream.
 */
export type Expect<T> = T extends Base32Format ? string : Uint8Array_;

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
 *   .pipeThrough(new Base32EncoderStream("Base32"));
 *
 * assertEquals(
 *   await toText(readable),
 *   encodeBase32(await Deno.readFile("./deno.lock"), "Base32"),
 * );
 * ```
 */
export class Base32EncoderStream<T extends Base32Format | Base32RawFormat>
  extends TransformStream<
    Uint8Array_,
    Expect<T>
  > {
  /**
   * Constructs a new instance.
   *
   * @param format The format of the base32 stream.
   */
  constructor(format: T) {
    const decode = function (): (input: Uint8Array_) => Expect<T> {
      if (format.startsWith("Raw-")) {
        format = format.slice(4) as T;
        return (x) => x as Expect<T>;
      }
      const decoder = new TextDecoder();
      return (x) => decoder.decode(x) as Expect<T>;
    }();
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
        const o = encode(
          output.subarray(0, -remainder || undefined),
          i,
          0,
          format as Base32Format,
        );
        controller.enqueue(decode(output.subarray(0, o)));
      },
      flush(controller) {
        if (remainder) {
          const [output, i] = detach(
            push.subarray(0, remainder),
            calcMax(remainder),
          );
          encode(output, i, 0, format as Base32Format);
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
 *   .pipeThrough(new Base32EncoderStream("Base32"))
 *   .pipeThrough(new Base32DecoderStream("Base32"));
 *
 * assertEquals(
 *   await toBytes(readable),
 *   await Deno.readFile("./deno.lock"),
 * );
 * ```
 *
 * @module
 */
export class Base32DecoderStream<T extends Base32Format | Base32RawFormat>
  extends TransformStream<Expect<T>, Uint8Array_> {
  /**
   * Constructs a new instance.
   *
   * @param format The format of the base32 stream.
   */
  constructor(format: T) {
    const encode = function (): (input: Expect<T>) => Uint8Array_ {
      if (format.startsWith("Raw-")) {
        format = format.slice(4) as T;
        return (x) => x as Uint8Array_;
      }
      const encoder = new TextEncoder();
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
          format as Base32Format,
        );
        controller.enqueue(output.subarray(0, o));
      },
      flush(controller) {
        if (remainder) {
          const o = decode(
            push.subarray(0, remainder),
            0,
            0,
            format as Base32Format,
          );
          controller.enqueue(push.subarray(0, o));
        }
      },
    });
  }
}
