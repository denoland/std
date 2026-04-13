// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";

/**
 * Change owner of a regular file or directory.
 *
 * This functionality is not available on Windows.
 *
 * Requires `allow-write` permission.
 *
 * Throws Error (not implemented) if executed on Windows.
 *
 * @example Usage
 * ```ts ignore
 * import { chown } from "@std/fs/unstable-chown";
 * await chown("README.md", 1000, 1002);
 * ```
 *
 * @tags allow-write
 *
 * @param path The path to the file/directory.
 * @param uid The user id (UID) of the new owner, or `null` for no change.
 * @param gid The group id (GID) of the new owner, or `null` for no change.
 */
// deno-lint-ignore deno-style-guide/exported-function-args-maximum
export async function chown(
  path: string | URL,
  uid: number | null,
  gid: number | null,
): Promise<void> {
  if (isDeno) {
    await Deno.chown(path, uid, gid);
  } else {
    try {
      await getNodeFs().promises.chown(path, uid ?? -1, gid ?? -1);
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously change owner of a regular file or directory.
 *
 * This functionality is not available on Windows.
 *
 * Requires `allow-write` permission.
 *
 * Throws Error (not implemented) if executed on Windows.
 *
 * @example Usage
 * ```ts ignore
 * import { chownSync } from "@std/fs/unstable-chown";
 * chownSync("README.md", 1000, 1002);
 * ```
 *
 * @tags allow-write
 *
 * @param path The path to the file/directory.
 * @param uid The user id (UID) of the new owner, or `null` for no change.
 * @param gid The group id (GID) of the new owner, or `null` for no change.
 */
// deno-lint-ignore deno-style-guide/exported-function-args-maximum
export function chownSync(
  path: string | URL,
  uid: number | null,
  gid: number | null,
): void {
  if (isDeno) {
    Deno.chownSync(path, uid, gid);
  } else {
    try {
      getNodeFs().chownSync(path, uid ?? -1, gid ?? -1);
    } catch (error) {
      throw mapError(error);
    }
  }
}
