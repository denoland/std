// Copyright 2018-2025 the Deno authors. MIT license.

import { getNodeFsPromises, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";
import { toDirEntry } from "./_to_dir_entry.ts";
import type { DirEntry } from "./unstable_types.ts";

async function* getDirEntries(path: string | URL): AsyncIterable<DirEntry> {
  const fsPromises = getNodeFsPromises();
  try {
    const dir = await fsPromises.opendir(path);
    for await (const entry of dir) {
      const dirEntry = toDirEntry(entry);
      yield dirEntry;
    }
  } catch (error) {
    throw error;
  }
}

/** Reads the directory given by `path` and returns an async iterable of
 * {@linkcode DirEntry}. The order of entries is not guaranteed.
 *
 * ```ts
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
 */
export function readDir(path: string | URL): AsyncIterable<DirEntry> {
  if (isDeno) {
    return Deno.readDir(path);
  } else {
    try {
      const dirEntries = getDirEntries(path);
      return dirEntries;
    } catch (error) {
      throw mapError(error);
    }
  }
}
