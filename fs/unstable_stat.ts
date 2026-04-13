// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";
import { toFileInfo } from "./_to_file_info.ts";
import type { FileInfo } from "./unstable_types.ts";

/**
 * Resolves to a {@linkcode FileInfo} for the specified `path`. Will
 * always follow symlinks.
 *
 * Requires `allow-read` permission in Deno.
 *
 * @example Usage
 * ```ts
 * import { assert } from "@std/assert";
 * import { stat } from "@std/fs/unstable-stat";
 * const fileInfo = await stat("README.md");
 * assert(fileInfo.isFile);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file or directory.
 * @returns A promise that resolves to a {@linkcode FileInfo} for the specified `path`.
 */
export async function stat(path: string | URL): Promise<FileInfo> {
  if (isDeno) {
    return Deno.stat(path);
  } else {
    try {
      return toFileInfo(await getNodeFs().promises.stat(path));
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously returns a {@linkcode FileInfo} for the specified
 * `path`. Will always follow symlinks.
 *
 * Requires `allow-read` permission in Deno.
 *
 * @example Usage
 * ```ts
 * import { assert } from "@std/assert";
 * import { statSync } from "@std/fs/unstable-stat";
 *
 * const fileInfo = statSync("README.md");
 * assert(fileInfo.isFile);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file or directory.
 * @returns A {@linkcode FileInfo} for the specified `path`.
 */
export function statSync(path: string | URL): FileInfo {
  if (isDeno) {
    return Deno.statSync(path);
  } else {
    try {
      return toFileInfo(getNodeFs().statSync(path));
    } catch (error) {
      throw mapError(error);
    }
  }
}
