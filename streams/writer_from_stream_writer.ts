// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { Writer } from "@std/io/types";

/**
 * Create a {@linkcode Writer} from a {@linkcode WritableStreamDefaultWriter}.
 *
 * @example
 * ```ts
 * import { copy } from "@std/io/copy";
 * import { writerFromStreamWriter } from "@std/streams/writer-from-stream-writer";
 *
 * using file = await Deno.open("./deno.land.html", { read: true });
 *
 * const writableStream = new WritableStream({
 *   write(chunk): void {
 *     console.log(chunk);
 *   },
 * });
 * const writer = writerFromStreamWriter(writableStream.getWriter());
 * await copy(file, writer);
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Use {@linkcode WritableStreamDefaultWriter} directly.
 */
export function writerFromStreamWriter(
  streamWriter: WritableStreamDefaultWriter<Uint8Array>,
): Writer {
  return {
    async write(p: Uint8Array): Promise<number> {
      await streamWriter.ready;
      await streamWriter.write(p);
      return p.length;
    },
  };
}
