// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";
import { toFileInfo } from "./_to_file_info.ts";
import type { FileInfo } from "./unstable_types.ts";

/**
 * Resolves to a {@linkcode FileInfo} for the specified `path`. If `path` is a symlink, information for the symlink will be returned instead of what it points to.
 *
 * Requires `allow-read` permission in Deno.
 *
 * @example Usage
 * ```ts
 * import { assert } from "@std/assert";
 * import { lstat } from "@std/fs/unstable-lstat";
 * const fileInfo = await lstat("README.md");
 * assert(fileInfo.isFile);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file or directory.
 * @returns A promise that resolves to a {@linkcode FileInfo} for the specified `path`.
 */
export async function lstat(path: string | URL): Promise<FileInfo> {
  if (isDeno) {
    return Deno.lstat(path);
  } else {
    try {
      return toFileInfo(await getNodeFs().promises.lstat(path));
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously returns a {@linkcode FileInfo} for the specified
 * `path`. If `path` is a symlink, information for the symlink will be
 * returned instead of what it points to.
 *
 * Requires `allow-read` permission in Deno.
 *
 * @example Usage
 *
 * ```ts
 * import { assert } from "@std/assert";
 * import { lstatSync } from "@std/fs/unstable-lstat";
 *
 * const fileInfo = lstatSync("README.md");
 * assert(fileInfo.isFile);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file or directory.
 * @returns A {@linkcode FileInfo} for the specified `path`.
 */
export function lstatSync(path: string | URL): FileInfo {
  if (isDeno) {
    return Deno.lstatSync(path);
  } else {
    try {
      return toFileInfo(getNodeFs().lstatSync(path));
    } catch (error) {
      throw mapError(error);
    }
  }
}
