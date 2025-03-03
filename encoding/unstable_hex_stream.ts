// Copyright 2018-2025 the Deno authors. MIT license.
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
 *   .pipeThrough(new HexEncoderStream("Hex"));
 *
 * assertEquals(
 *   await toText(readable),
 *   encodeHex(await Deno.readFile("./deno.lock"), "Hex"),
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
  calcMax,
  decodeRawHex as decode,
  encodeRawHex as encode,
  type HexFormat,
} from "./unstable_hex.ts";
import { detach } from "./_common_detach.ts";

/**
 * The raw hex encoding formats.
 */
export type HexRawFormat = `Raw-${HexFormat}`;
/**
 * A type used to represent the expected output of a hex stream.
 */
export type Expect<T> = T extends HexFormat ? string : Uint8Array_;

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
 *   .pipeThrough(new HexEncoderStream("Hex"));
 *
 * assertEquals(
 *   await toText(readable),
 *   encodeHex(await Deno.readFile("./deno.lock"), "Hex"),
 * );
 * ```
 */
export class HexEncoderStream<T extends HexFormat | HexRawFormat>
  extends TransformStream<Uint8Array_, Expect<T>> {
  /**
   * Constructs a new instance.
   *
   * @param format The format of the hexadecimal stream.
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
    super({
      transform(chunk, controller) {
        const [output, i] = detach(chunk, calcMax(chunk.length));
        encode(output, i, 0, format as HexFormat);
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
 *   .pipeThrough(new HexEncoderStream("Hex"))
 *   .pipeThrough(new HexDecoderStream("Hex"));
 *
 * assertEquals(
 *   await toBytes(readable),
 *   await Deno.readFile("./deno.lock"),
 * );
 * ```
 */
export class HexDecoderStream<T extends HexFormat | HexRawFormat>
  extends TransformStream<Expect<T>, Uint8Array_> {
  /**
   * Constructs a new instance.
   *
   * @param format The format of the hexadecimal stream.
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
          format as HexFormat,
        );
        controller.enqueue(output.subarray(0, o));
      },
      flush(controller) {
        if (remainder) {
          const o = decode(
            push.subarray(0, remainder),
            0,
            0,
            format as HexFormat,
          );
          controller.enqueue(push.subarray(0, o));
        }
      },
    });
  }
}
