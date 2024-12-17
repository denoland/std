// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { getNodeFsPromises, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";
import { toFileInfo } from "./_to_file_info.ts";
import type { FileInfo } from "./unstable_types.ts";

/** Resolves to a {@linkcode FileInfo} for the specified `path`. Will
 * always follow symlinks.
 *
 * ```ts
 * import { assert } from "@std/assert";
 * import { stat } from "@std/fs/unstable-stat";
 * const fileInfo = await stat("README.md");
 * assert(fileInfo.isFile);
 * ```
 *
 * Requires `allow-read` permission.
 *
 * @tags allow-read
 * @category File System
 */
export async function stat(path: string | URL): Promise<FileInfo> {
  if (isDeno) {
    return Deno.stat(path);
  } else {
    const fsPromises = getNodeFsPromises();
    try {
      const stat = await fsPromises.stat(path);
      return toFileInfo(stat);
    } catch (error) {
      throw mapError(error);
    }
  }
}
