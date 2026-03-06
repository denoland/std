// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";

/** Changes the access (`atime`) and modification (`mtime`) times of a file
 * system object referenced by `path`. Given times are either in seconds
 * (UNIX epoch time) or as `Date` objects.
 *
 * Requires `allow-write` permission for the target path
 *
 * @example Usage
 *
 * ```ts
 * import { assert } from "@std/assert"
 * import { utime } from "@std/fs/unstable-utime";
 * import { stat } from "@std/fs/unstable-stat"
 *
 * const newAccessDate = new Date()
 * const newModifiedDate = new Date()
 *
 * const fileBefore = await Deno.stat("README.md")
 * await Deno.utime("README.md", newAccessDate, newModifiedDate)
 * const fileAfter = await Deno.stat("README.md")
 *
 * assert(fileBefore.atime !== fileAfter.atime)
 * assert(fileBefore.mtime !== fileAfter.mtime)
 * ```
 * @tags allow-write
 * @category File System
 * @param path The path to the file to be updated
 * @param atime The new access time
 * @param mtime The new modification time
 */
// deno-lint-ignore deno-style-guide/exported-function-args-maximum
export async function utime(
  path: string | URL,
  atime: number | Date,
  mtime: number | Date,
): Promise<void> {
  if (isDeno) {
    await Deno.utime(path, atime, mtime);
  } else {
    try {
      await getNodeFs().promises.utimes(path, atime, mtime);
      return;
    } catch (error) {
      throw mapError(error);
    }
  }
}

/** Synchronously changes the access (`atime`) and modification (`mtime`)
 * times of the file stream resource. Given times are either in seconds
 * (UNIX epoch time) or as `Date` objects.
 *
 * Requires `allow-write` permission for the target path
 *
 * @example Usage
 *
 * ```ts
 * import { assert } from "@std/assert"
 * import { utimeSync } from "@std/fs/unstable-utime";
 * import { stat } from "@std/fs/unstable-stat"
 *
 * const newAccessDate = new Date()
 * const newModifiedDate = new Date()
 *
 * const fileBefore = await Deno.stat("README.md")
 * Deno.utimeSync("README.md", newAccessDate, newModifiedDate)
 * const fileAfter = await Deno.stat("README.md")
 *
 * assert(fileBefore.atime !== fileAfter.atime)
 * assert(fileBefore.mtime !== fileAfter.mtime)
 * ```
 * @tags allow-write
 * @category File System
 * @param path The path to the file to be updated
 * @param atime The new access time
 * @param mtime The new modification time
 */
// deno-lint-ignore deno-style-guide/exported-function-args-maximum
export function utimeSync(
  path: string | URL,
  atime: number | Date,
  mtime: number | Date,
): void {
  if (isDeno) {
    return Deno.utimeSync(path, atime, mtime);
  } else {
    try {
      getNodeFs().utimesSync(path, atime, mtime);
    } catch (error) {
      throw mapError(error);
    }
  }
}
