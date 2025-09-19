// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import type { Uint8Array_ } from "./_types.ts";

/**
 * The function takes a `ReadableStream<Uint8Array>` and wraps it in a BYOB
 * stream if it doesn't already support it.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { toByteStream } from "@std/streams/unstable-to-byte-stream";
 *
 * const reader = toByteStream(ReadableStream.from([new Uint8Array(100)]))
 *   .getReader({ mode: "byob" });
 *
 * while (true) {
 *   const { done, value } = await reader.read(new Uint8Array(10), { min: 10 });
 *   if (done) break;
 *   assertEquals(value.length, 10);
 * }
 *
 * reader.releaseLock();
 * ```
 *
 * @param readable The ReadableStream to be wrapped if needed.
 * @returns A BYOB ReadableStream.
 */
export function toByteStream(
  readable: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  try {
    const reader = readable.getReader({ mode: "byob" });
    reader.releaseLock();
    return readable;
  } catch {
    const reader = readable.getReader();
    return new ReadableStream({
      type: "bytes",
      autoAllocateChunkSize: 1024,
      async pull(controller) {
        const value = await async function () {
          while (true) {
            const { done, value } = await reader.read();
            if (done) return undefined;
            if (value.length) return value;
          }
        }();

        if (value == undefined) {
          controller.close();
          return controller.byobRequest!.respond(0);
        }

        const buffer = new Uint8Array(
          controller.byobRequest!.view!.buffer,
          controller.byobRequest!.view!.byteOffset,
          controller.byobRequest!.view!.byteLength,
        );
        const size = buffer.length;
        if (value.length > size) {
          buffer.set(value.subarray(0, size));
          controller.byobRequest!.respond(size);
          controller.enqueue(value.subarray(size) as Uint8Array_);
        } else {
          buffer.set(value);
          controller.byobRequest!.respond(value.length);
        }
      },
      async cancel(reason) {
        await reader.cancel(reason);
      },
    });
  }
}
