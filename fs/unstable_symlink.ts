// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";
import type { SymlinkOptions } from "./unstable_types.ts";

/**
 * Creates `newpath` as a symbolic link to `oldpath`.
 *
 * The `options.type` parameter can be set to `"file"`, `"dir"` or `"junction"`.
 * This argument is only available on Windows and ignored on other platforms.
 *
 * Requires full `allow-read` and `allow-write` permissions.
 *
 * @example Usage
 * ```ts ignore
 * import { symlink } from "@std/fs/unstable-symlink";
 * await symlink("README.md", "README.md.link");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param oldpath The path of the resource pointed by the symbolic link.
 * @param newpath The path of the symbolic link.
 * @param options Options when creating a symbolic link.
 */
export async function symlink(
  oldpath: string | URL,
  newpath: string | URL,
  options?: SymlinkOptions,
): Promise<void> {
  if (isDeno) {
    return Deno.symlink(oldpath, newpath, options);
  } else {
    try {
      return await getNodeFs().promises.symlink(
        oldpath,
        newpath,
        options?.type,
      );
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Creates `newpath` as a symbolic link to `oldpath`.
 *
 * The `options.type` parameter can be set to `"file"`, `"dir"` or `"junction"`.
 * This argument is only available on Windows and ignored on other platforms.
 *
 * Requires full `allow-read` and `allow-write` permissions.
 *
 * @example Usage
 * ```ts ignore
 * import { symlinkSync } from "@std/fs/unstable-symlink";
 * symlinkSync("README.md", "README.md.link");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param oldpath The path of the resource pointed by the symbolic link.
 * @param newpath The path of the symbolic link.
 * @param options Options when creating a symbolic link.
 */
export function symlinkSync(
  oldpath: string | URL,
  newpath: string | URL,
  options?: SymlinkOptions,
): void {
  if (isDeno) {
    return Deno.symlinkSync(oldpath, newpath, options);
  } else {
    try {
      return getNodeFs().symlinkSync(oldpath, newpath, options?.type);
    } catch (error) {
      throw mapError(error);
    }
  }
}
