// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { getWriteFsFlag } from "./_get_fs_flag.ts";
import { mapError } from "./_map_error.ts";
import type { WriteFileOptions } from "./unstable_types.ts";

/**
 * Write string `data` to the given `path`, by default creating a new file if
 * needed, else overwriting.
 *
 * Requires `allow-write` permission, and `allow-read` if `options.create` is
 * `false`.
 *
 * @example Usage
 * ```ts ignore
 * import { writeTextFile } from "@std/fs/unstable-write-text-file";
 * await writeTextFile("hello1.txt", "Hello world\n");  // overwrite "hello1.txt" or create it
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path of the file that `data` is written to.
 * @param data A UTF-8 string or a stream of UTF-8 strings.
 * @param options Options for writing files. See {@linkcode WriteFileOptions}.
 */
export async function writeTextFile(
  path: string | URL,
  data: string | ReadableStream<string>,
  options?: WriteFileOptions,
): Promise<void> {
  if (isDeno) {
    await Deno.writeTextFile(path, data, { ...options });
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
      await getNodeFs().promises.writeFile(path, data, {
        encoding: "utf-8",
        flag,
        signal,
      });
      if (mode != null) {
        await getNodeFs().promises.chmod(path, mode);
      }
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously write string `data` to the given `path`, by default creating
 * a new file if needed, else overwriting.
 *
 * Requires `allow-write` permission, and `allow-read` if `options.create` is
 * `false`.
 *
 * @example Usage
 * ```ts ignore
 * import { writeTextFileSync } from "@std/fs/unstable-write-text-file";
 * writeTextFileSync("hello1.txt", "Hello world\n");  // overwrite "hello1.txt" or create it
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path of the file that `data` is written to.
 * @param data A UTF-8 string.
 * @param options Options for writing files. See {@linkcode WriteFileOptions}.
 */
export function writeTextFileSync(
  path: string | URL,
  data: string,
  options?: WriteFileOptions,
): void {
  if (isDeno) {
    Deno.writeTextFileSync(path, data, { ...options });
  } else {
    const {
      append = false,
      create = true,
      createNew = false,
      mode,
    } = options ?? {};

    const flag = getWriteFsFlag({ append, create, createNew });
    try {
      getNodeFs().writeFileSync(path, data, { encoding: "utf-8", flag });
      if (mode != null) {
        getNodeFs().chmodSync(path, mode);
      }
    } catch (error) {
      throw mapError(error);
    }
  }
}
