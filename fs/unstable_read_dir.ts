// Copyright 2018-2025 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";
import { toDirEntry } from "./_to_dir_entry.ts";
import type { DirEntry } from "./unstable_types.ts";

/** Reads the directory given by `path` and returns an async iterable of
 * {@linkcode DirEntry}. The order of entries is not guaranteed.
 *
 * @example Usage
 * ```ts no-assert
 * import { readDir } from "@std/fs/unstable-read-dir";
 *
 * for await (const dirEntry of readDir("/")) {
 *   console.log(dirEntry.name);
 * }
 * ```
 *
 * Throws error if `path` is not a directory.
 *
 * Requires `allow-read` permission.
 *
 * @tags allow-read
 * @category File System
 *
 * @param path The path to the directory to read.
 * @returns An async iterable of {@linkcode DirEntry}.
 */
export async function* readDir(path: string | URL): AsyncIterable<DirEntry> {
  if (isDeno) {
    yield* Deno.readDir(path);
  } else {
    try {
      const dir = await getNodeFs().promises.opendir(path);
      for await (const entry of dir) {
        yield toDirEntry(entry);
      }
    } catch (error) {
      throw mapError(error);
    }
  }
}
