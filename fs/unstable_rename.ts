// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";

/**
 * Renames (moves) `oldpath` to `newpath`. Paths may be files or directories.
 * If `newpath` already exists and is not a directory, `rename()` replaces it.
 * OS-specific restrictions may apply when `oldpath` and `newpath` are in
 * different directories.
 *
 * On Unix-like OSes, this operation does not follow symlinks at either path.
 *
 * It varies between platforms when the operation throws errors, and if so
 * what they are. It's always an error to rename anything to a non-empty
 * directory.
 *
 * Requires `allow-read` and `allow-write` permissions.
 *
 * @example Usage
 * ```ts ignore
 * import { rename } from "@std/fs/unstable-rename";
 * await rename("old/path", "new/path");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param oldpath The current name/path of the file/directory.
 * @param newpath The updated name/path of the file/directory.
 */
export async function rename(
  oldpath: string | URL,
  newpath: string | URL,
): Promise<void> {
  if (isDeno) {
    await Deno.rename(oldpath, newpath);
  } else {
    try {
      await getNodeFs().promises.rename(oldpath, newpath);
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously renames (moves) `oldpath` to `newpath`. Paths may be files or
 * directories. If `newpath` already exists and is not a directory,
 * `renameSync()` replaces it. OS-specific restrictions may apply when
 * `oldpath` and `newpath` are in different directories.
 *
 * On Unix-like OSes, this operation does not follow symlinks at either path.
 *
 * It varies between platforms when the operation throws errors, and if so what
 * they are. It's always an error to rename anything to a non-empty directory.
 *
 * Requires `allow-read` and `allow-write` permissions.
 *
 * @example Usage
 * ```ts ignore
 * import { renameSync } from "@std/fs/unstable-rename";
 * renameSync("old/path", "new/path");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param oldpath The current name/path of the file/directory.
 * @param newpath The updated name/path of the file/directory.
 */
export function renameSync(oldpath: string | URL, newpath: string | URL): void {
  if (isDeno) {
    Deno.renameSync(oldpath, newpath);
  } else {
    try {
      getNodeFs().renameSync(oldpath, newpath);
    } catch (error) {
      throw mapError(error);
    }
  }
}
