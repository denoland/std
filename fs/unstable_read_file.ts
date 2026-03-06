// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import type { ReadFileOptions } from "./unstable_types.ts";
import { mapError } from "./_map_error.ts";

/**
 * Reads and resolves to the entire contents of a file as an array of bytes.
 * `TextDecoder` can be used to transform the bytes to string if required.
 *
 * Requires `allow-read` permission.
 *
 * @example Usage
 * ```ts no-assert
 * import { readFile } from "@std/fs/unstable-read-file";
 * const decoder = new TextDecoder("utf-8");
 * const data = await readFile("README.md");
 * console.log(decoder.decode(data));
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file.
 * @param options Options when reading a file. See {@linkcode ReadFileOptions}.
 * @returns A promise that resolves to a `Uint8Array` of the file contents.
 */
export async function readFile(
  path: string | URL,
  options?: ReadFileOptions,
): Promise<Uint8Array> {
  if (isDeno) {
    return Deno.readFile(path, { ...options });
  } else {
    const { signal } = options ?? {};
    try {
      const buf = await getNodeFs().promises.readFile(path, { signal });
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously reads and returns the entire contents of a file as an array
 * of bytes. `TextDecoder` can be used to transform the bytes to string if
 * required.
 *
 * Requires `allow-read` permission.
 *
 * @example Usage
 * ```ts no-assert
 * import { readFileSync } from "@std/fs/unstable-read-file";
 * const decoder = new TextDecoder("utf-8");
 * const data = readFileSync("README.md");
 * console.log(decoder.decode(data));
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file.
 * @returns A `Uint8Array` of bytes representing the file contents.
 */
export function readFileSync(path: string | URL): Uint8Array {
  if (isDeno) {
    return Deno.readFileSync(path);
  } else {
    try {
      const buf = getNodeFs().readFileSync(path);
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
    } catch (error) {
      throw mapError(error);
    }
  }
}
