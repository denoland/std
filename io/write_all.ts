// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { Writer, WriterSync } from "./types.ts";

/**
 * Write all the content of the array buffer (`arr`) to the writer (`w`).
 *
 * @example
 * ```ts
 * import { writeAll } from "@std/io/write-all";

 * // Example writing to stdout
 * let contentBytes = new TextEncoder().encode("Hello World");
 * await writeAll(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * contentBytes = new TextEncoder().encode("Hello World");
 * using file = await Deno.open('test.file', {write: true});
 * await writeAll(file, contentBytes);
 * ```
 */
export async function writeAll(writer: Writer, data: Uint8Array) {
  let nwritten = 0;
  while (nwritten < data.length) {
    nwritten += await writer.write(data.subarray(nwritten));
  }
}

/**
 * Synchronously write all the content of the array buffer (`arr`) to the
 * writer (`w`).
 *
 * @example
 * ```ts
 * import { writeAllSync } from "@std/io/write-all";
 *
 * // Example writing to stdout
 * let contentBytes = new TextEncoder().encode("Hello World");
 * writeAllSync(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * contentBytes = new TextEncoder().encode("Hello World");
 * using file = Deno.openSync('test.file', {write: true});
 * writeAllSync(file, contentBytes);
 * ```
 */
export function writeAllSync(writer: WriterSync, data: Uint8Array) {
  let nwritten = 0;
  while (nwritten < data.length) {
    nwritten += writer.writeSync(data.subarray(nwritten));
  }
}
