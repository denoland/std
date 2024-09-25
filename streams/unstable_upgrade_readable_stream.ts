// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * The function upgrades a `ReadableStream<Uint8Array>` to support BYOB mode
 * if the readable doesn't already support it.
 * 
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { upgradeReadable } from "@std/streams/unstable-upgrade-readable-stream";
 * 
 * const reader = upgradeReadable(ReadableStream.from([new Uint8Array(100)]))
 *   .getReader({ mode: "byob" });
 * 
 * while (true) {
 *   const { done, value } = await reader.read(new Uint8Array(10), { min: 10 });
 *   if (done) break;
 *   assertEquals(value.length, 10);
 * }
 * reader.releaseLock();
 * ```
 * 
 * @param readable The ReadableStream to be upgraded if needed.
 * @returns A BYOB ReadableStream.
 */
export function upgradeReadable(readable: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  try {
    const reader = readable.getReader({ mode: "byob" });
    reader.releaseLock();
    return readable;
  } catch {
    const reader = readable.getReader();
    return new ReadableStream({
      type: "bytes",
      async pull(controller) {
        const value = async function () {
          while (true) {
            const { done, value } = await reader.read();
            if (done) return undefined;
            if (value.length) return value;
          }
        }();

        if (value == undefined) {
          controller.close();
          return controller.byobRequest?.respond(0);
        }

        if (controller.byobRequest?.view) {
          const buffer = new Uint8Array(controller.byobRequest.view.buffer);
          const size = buffer.size;
          if (value.length > size) {
            buffer.set(value.slice(0, size));
            controller.byobRequest.respond(size);
            controller.enqueue(value.slice(size));
          }
          else {
            buffer.set(value);
            controller.byobRequest.respond(value.length);
          }
        }
        else controller.enqueue(value);
      },
      async cancel(reason: any): Promise<void> {
        await reader.cancel(reason);
      }
    });
  }
}