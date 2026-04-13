// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { getWriteFsFlag } from "./_get_fs_flag.ts";
import { mapError } from "./_map_error.ts";
import type { WriteFileOptions } from "./unstable_types.ts";

/**
 * Write `data` to the given `path`, by default creating a new file if needed,
 * else overwriting.
 *
 * Requires `allow-write` permission, and `allow-read` if `options.create` is
 * `false`.
 *
 * @example Usage
 * ```ts ignore
 * import { writeFile } from "@std/fs/unstable-write-file";
 * const encoder = new TextEncoder();
 * const data = encoder.encode("Hello world\n");
 * await Deno.writeFile("hello1.txt", data);  // overwrite "hello1.txt" or create it
 * await Deno.writeFile("hello2.txt", data, { create: false });  // only works if "hello2.txt" exists
 * await Deno.writeFile("hello3.txt", data, { mode: 0o777 });  // set permissions on new file
 * await Deno.writeFile("hello4.txt", data, { append: true });  // add data to the end of the file
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path of the file that `data` is written to.
 * @param data The content in bytes or a stream of bytes to be written.
 * @param options Options to write files. See {@linkcode WriteFileOptions}.
 */
export async function writeFile(
  path: string | URL,
  data: Uint8Array | ReadableStream<Uint8Array>,
  options?: WriteFileOptions,
): Promise<void> {
  if (isDeno) {
    await Deno.writeFile(path, data, { ...options });
  } else {
    const {
      append = false,
      create = true,
      createNew = false,
      mode,
      signal,
    } = options ?? {};

    const flag = getWriteFsFlag({ append, create, createNew });
    try {
      await getNodeFs().promises.writeFile(path, data, { flag, signal });
      if (mode != null) {
        await getNodeFs().promises.chmod(path, mode);
      }
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously write `data` to the given `path`, by default creating a new
 * file if needed, else overwriting.
 *
 * Requires `allow-write` permission, and `allow-read` if `options.create` is
 * `false`.
 *
 * @example Usage
 * ```ts ignore
 * import { writeFileSync } from "@std/fs/unstable-write-file";
 * const encoder = new TextEncoder();
 * const data = encoder.encode("Hello world\n");
 * writeFileSync("hello1.txt", data);  // overwrite "hello1.txt" or create it
 * writeFileSync("hello2.txt", data, { create: false });  // only works if "hello2.txt" exists
 * writeFileSync("hello3.txt", data, { mode: 0o777 });  // set permissions on new file
 * writeFileSync("hello4.txt", data, { append: true });  // add data to the end of the file
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path of the file that `data` is written to.
 * @param data The content in bytes to be written.
 * @param options Options to write files. See {@linkcode WriteFileOptions}.
 */
export function writeFileSync(
  path: string | URL,
  data: Uint8Array,
  options?: WriteFileOptions,
): void {
  if (isDeno) {
    Deno.writeFileSync(path, data, { ...options });
  } else {
    const {
      append = false,
      create = true,
      createNew = false,
      mode,
      signal,
    } = options ?? {};

    const flag = getWriteFsFlag({ append, create, createNew });
    try {
      getNodeFs().writeFileSync(path, data, { flag, signal });
      if (mode != null) {
        getNodeFs().chmodSync(path, mode);
      }
    } catch (error) {
      throw mapError(error);
    }
  }
}
