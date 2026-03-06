// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";

/**
 * Creates `newpath` as a hard link to `oldpath`.
 *
 * Requires `allow-read` and `allow-write` permissions.
 *
 * @example Usage
 * ```ts ignore
 * import { link } from "@std/fs/unstable-link";
 * await link("old/name", "new/name");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param oldpath The path of the resource pointed by the hard link.
 * @param newpath The path of the hard link.
 */
export async function link(oldpath: string, newpath: string): Promise<void> {
  if (isDeno) {
    await Deno.link(oldpath, newpath);
  } else {
    try {
      await getNodeFs().promises.link(oldpath, newpath);
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously creates `newpath` as a hard link to `oldpath`.
 *
 * Requires `allow-read` and `allow-write` permissions.
 *
 * @example Usage
 * ```ts ignore
 * import { linkSync } from "@std/fs/unstable-link";
 * linkSync("old/name", "new/name");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param oldpath The path of the resource pointed by the hard link.
 * @param newpath The path of the hard link.
 */
export function linkSync(oldpath: string, newpath: string): void {
  if (isDeno) {
    Deno.linkSync(oldpath, newpath);
  } else {
    try {
      getNodeFs().linkSync(oldpath, newpath);
    } catch (error) {
      throw mapError(error);
    }
  }
}
