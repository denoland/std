// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { Buffer } from "../io/buffer.ts";
import type { Reader, ReaderSync } from "../io/types.ts";

/**
 * Read {@linkcode Reader} `r` until EOF (`null`) and resolve to the content as
 * {@linkcode Uint8Array}.
 *
 * @example
 * ```ts
 * import { Buffer } from "https://deno.land/std@$STD_VERSION/io/buffer.ts";
 * import { readAll } from "https://deno.land/std@$STD_VERSION/streams/read_all.ts";
 *
 * // Example from stdin
 * const stdinContent = await readAll(Deno.stdin);
 *
 * // Example from file
 * using file = await Deno.open("my_file.txt", {read: true});
 * const myFileContent = await readAll(file);
 *
 * // Example from buffer
 * const myData = new Uint8Array(100);
 * // ... fill myData array with data
 * const reader = new Buffer(myData.buffer);
 * const bufferContent = await readAll(reader);
 * ```
 *
 * @deprecated (will be removed after 1.0.0) Use {@linkcode ReadableStream}
 * and {@linkcode toArrayBuffer} instead.
 */
export async function readAll(r: Reader): Promise<Uint8Array> {
  const buf = new Buffer();
  await buf.readFrom(r);
  return buf.bytes();
}

/**
 * Synchronously reads {@linkcode Reader} `r` until EOF (`null`) and returns
 * the content as {@linkcode Uint8Array}.
 *
 * @example
 * ```ts
 * import { Buffer } from "https://deno.land/std@$STD_VERSION/io/buffer.ts";
 * import { readAllSync } from "https://deno.land/std@$STD_VERSION/streams/read_all.ts";
 *
 * // Example from stdin
 * const stdinContent = readAllSync(Deno.stdin);
 *
 * // Example from file
 * using file = Deno.openSync("my_file.txt", {read: true});
 * const myFileContent = readAllSync(file);
 *
 * // Example from buffer
 * const myData = new Uint8Array(100);
 * // ... fill myData array with data
 * const reader = new Buffer(myData.buffer);
 * const bufferContent = readAllSync(reader);
 * ```
 *
 * @deprecated (will be removed after 1.0.0) Use {@linkcode ReadableStream} and
 * {@linkcode toArrayBuffer} instead.
 */
export function readAllSync(r: ReaderSync): Uint8Array {
  const buf = new Buffer();
  buf.readFromSync(r);
  return buf.bytes();
}
