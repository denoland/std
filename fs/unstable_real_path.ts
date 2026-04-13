// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";

/**
 * Resolves to the absolute normalized path, with symbolic links resolved.
 *
 * Requires `allow-read` permission for the target path.
 *
 * Also requires `allow-read` permission for the `CWD` if the target path is
 * relative.
 *
 * @example Usage
 * ```ts ignore
 * import { realPath } from "@std/fs/unstable-real-path";
 * import { symlink } from "@std/fs/unstable-symlink";
 * // e.g. given /home/alice/file.txt and current directory /home/alice
 * await symlink("file.txt", "symlink_file.txt");
 * const fileRealPath = await realPath("./file.txt");
 * const realSymLinkPath = await realPath("./symlink_file.txt");
 * console.log(fileRealPath);  // outputs "/home/alice/file.txt"
 * console.log(realSymLinkPath);  // outputs "/home/alice/file.txt"
 * ```
 *
 * @tags allow-read
 *
 * @param path The path of the file or directory.
 * @returns A promise fulfilling with the absolute `path` of the file.
 */
export async function realPath(path: string | URL): Promise<string> {
  if (isDeno) {
    return Deno.realPath(path);
  } else {
    try {
      return await getNodeFs().promises.realpath(path);
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously returns absolute normalized path, with symbolic links
 * resolved.
 *
 * Requires `allow-read` permission for the target path.
 *
 * Also requires `allow-read` permission for the `CWD` if the target path is
 * relative.
 *
 * @example Usage
 * ```ts ignore
 * import { realPathSync } from "@std/fs/unstable-real-path";
 * import { symlinkSync } from "@std/fs/unstable-symlink";
 * // e.g. given /home/alice/file.txt and current directory /home/alice
 * symlinkSync("file.txt", "symlink_file.txt");
 * const realPath = realPathSync("./file.txt");
 * const realSymLinkPath = realPathSync("./symlink_file.txt");
 * console.log(realPath);  // outputs "/home/alice/file.txt"
 * console.log(realSymLinkPath);  // outputs "/home/alice/file.txt"
 * ```
 *
 * @tags allow-read
 *
 * @param path The path of the file or directory.
 * @returns The absolute `path` of the file.
 */
export function realPathSync(path: string | URL): string {
  if (isDeno) {
    return Deno.realPathSync(path);
  } else {
    try {
      return getNodeFs().realpathSync(path);
    } catch (error) {
      throw mapError(error);
    }
  }
}
