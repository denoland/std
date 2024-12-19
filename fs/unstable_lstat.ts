// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { getNodeFsPromises, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";
import { toFileInfo } from "./_to_file_info.ts";
import type { FileInfo } from "./unstable_types.ts";

/** Resolves to a {@linkcode FileInfo} for the specified `path`. If `path` is a symlink, information for the symlink will be returned instead of what it points to.
 *
 * ```ts
 * import { assert } from "@std/assert";
 * import { lstat } from "@std/fs/unstable-lstat";
 * const fileInfo = await lstat("README.md");
 * assert(fileInfo.isFile);
 * ```
 *
 * Requires `allow-read` permission.
 *
 * @tags allow-read
 * @category File System
 */
export async function lstat(path: string | URL): Promise<FileInfo> {
  if (isDeno) {
    return Deno.lstat(path);
  } else {
    const fsPromises = getNodeFsPromises();
    try {
      const stat = await fsPromises.lstat(path);
      return toFileInfo(stat);
    } catch (error) {
      throw mapError(error);
    }
  }
}
