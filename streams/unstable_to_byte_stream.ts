// Copyright 2018-2025 the Deno authors. MIT license.

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
          return controller.byobRequest?.respond(0);
        }

        if (controller.byobRequest?.view) {
          const buffer = new Uint8Array(controller.byobRequest.view.buffer);
          const offset = controller.byobRequest.view.byteOffset;
          const size = buffer.length - offset;
          if (value.length > size) {
            buffer.set(value.slice(0, size), offset);
            controller.byobRequest.respond(size);
            controller.enqueue(value.slice(size));
          } else {
            buffer.set(value, offset);
            controller.byobRequest.respond(value.length);
          }
        } else controller.enqueue(value);
      },
      async cancel(reason) {
        await reader.cancel(reason);
      },
    });
  }
}
