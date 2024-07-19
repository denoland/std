// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Converts a ReadableStream<Uint8Array> into a BYOB Reader that guarantees the
 * buffer will be full, with the exception of the last value.
 *
 * @example Basic Usage
 * ```ts
 * import { ExactReader } from "@std/streams/exact-reader";
 * import { assertEquals } from "@std/assert";
 *
 * const reader = new ExactReader((await Deno.open("./deno.json")).readable);
 *
 * const values = await Array.fromAsync(async function* () {
 *   while (true) {
 *     const { done, value } = await reader.read(new Uint8Array(1024));
 *     if (done) {
 *       break
 *     }
 *     yield value
 *   }
 * }());
 *
 * values.slice(0, -1).forEach(value => assertEquals(value.length, 1024));
 * ```
 */
export class ExactReader extends ReadableStreamBYOBReader {
  /**
   * Constructs a new instance.
   *
   * @param readable The ReadableStream<Uint8Array> to be consumed.
   */
  constructor(readable: ReadableStream<Uint8Array>) {
    const reader = readable.getReader();
    let offset = 0;
    let leftover: Uint8Array | undefined;
    super(
      new ReadableStream({
        type: "bytes",
        async pull(controller) {
          if (!controller.byobRequest?.view) {
            return;
          }

          const buffer = new Uint8Array(controller.byobRequest.view.buffer);
          if (leftover) {
            if (leftover.length > buffer.length) {
              buffer.set(leftover.slice(0, buffer.length));
              leftover = leftover.slice(buffer.length);
              return controller.byobRequest.respond(buffer.length);
            }
            buffer.set(leftover);
            offset = leftover.length;
            leftover = undefined;
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              if (offset) {
                controller.byobRequest.respond(offset);
                controller.close();
              } else {
                controller.close();
                controller.byobRequest.respond(0);
              }
              return;
            }

            const spaceAvailable = buffer.length - offset;
            if (value.length > spaceAvailable) {
              buffer.set(value.slice(0, spaceAvailable), offset);
              leftover = value.slice(spaceAvailable);
              controller.byobRequest.respond(buffer.length);
              return;
            }
            buffer.set(value, offset);
            offset += value.length;
            if (buffer.length === offset) {
              offset = 0;
              controller.byobRequest.respond(buffer.length);
              return;
            }
          }
        },
      }),
    );
  }
}
