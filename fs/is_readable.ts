// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

export interface IsReadableOptions {
  /**
   * When `true`, will check if the path is a directory as well.
   * Directory symlinks are included.
   */
  isDirectory?: boolean;
  /**
   * When `true`, will check if the path is a file as well.
   * File symlinks are included.
   */
  isFile?: boolean;
}

/**
 * Test whether or not the given path exists and is readable by checking with the file system. To check simultaneously if the path is either a file or a directory please provide additional `options`.
 *
 * Note: Do not use this function if performing a check before another operation on that file. Doing so creates a race condition. Instead, perform the actual file operation directly.
 *
 * Bad:
 * ```ts
 * import { isReadable } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * if (await isReadable("./foo")) {
 *   await Deno.remove("./foo");
 * }
 * ```
 *
 * Good:
 * ```ts
 * // Notice no use of isReadable
 * try {
 *   await Deno.remove("./foo", { recursive: true });
 * } catch (error) {
 *   if (!(error instanceof Deno.errors.NotFound)) {
 *     throw error;
 *   }
 *   // Do nothing...
 * }
 * ```
 * @see https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
 */
export async function isReadable(
  path: string | URL,
  options?: IsReadableOptions
): Promise<boolean> {
  try {
    const stat: Deno.FileInfo = await Deno.stat(path);
    if (options && (options.isDirectory || options.isFile)) {
      if (options.isDirectory && options.isFile) {
        throw new TypeError(
          "IsReadableOptions.options.isDirectory and IsReadableOptions.options.isFile must not be true together."
        );
      }
      if (
        (options.isDirectory && !stat.isDirectory) ||
        (options.isFile && !stat.isFile)
      ) {
        return false;
      }
    }
    if (stat.mode == null) {
      return true; // Exclusive on Non-POSIX systems
    }
    if (Deno.uid() == stat.uid) {
      // User is owner
      return (stat.mode & 0o400) == 0o400; // ... and user can read?
    } else if (Deno.gid() == stat.gid) {
      // User is in owner group
      return (stat.mode & 0o040) == 0o040; // ... and group can read?
    }
    return (stat.mode & 0o004) == 0o004; // Others can read?
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      return false; // Exclusive on Windows systems
    }
    throw error;
  }
}

/**
 * Test whether or not the given path is readable by checking with the file system. To check simultaneously if the path is either a file or a directory please use `isReadableFile` or `isReadableDir` instead.
 *
 * Note: do not use this function if performing a check before another operation on that file. Doing so creates a race condition. Instead, perform the actual file operation directly.
 *
 * Bad:
 * ```ts
 * import { isReadableSync } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * if (isReadableSync("./foo")) {
 *   Deno.removeSync("./foo");
 * }
 * ```
 *
 * Good:
 * ```ts
 * // Notice no use of isReadableSync
 * try {
 *   Deno.removeSync("./foo", { recursive: true });
 * } catch (error) {
 *   if (!(error instanceof Deno.errors.NotFound)) {
 *     throw error;
 *   }
 *   // Do nothing...
 * }
 * ```
 * @see https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
 */
export function isReadableSync(
  path: string | URL,
  options?: IsReadableOptions
): boolean {
  try {
    const stat: Deno.FileInfo = Deno.statSync(path);
    if (options && (options.isDirectory || options.isFile)) {
      if (options.isDirectory && options.isFile) {
        throw new TypeError(
          "IsReadableOptions.options.isDirectory and IsReadableOptions.options.isFile must not be true together."
        );
      }
      if (
        (options.isDirectory && !stat.isDirectory) ||
        (options.isFile && !stat.isFile)
      ) {
        return false;
      }
    }
    if (stat.mode == null) {
      return true; // Exclusive on Non-POSIX systems
    }
    if (Deno.uid() == stat.uid) {
      // User is owner
      return (stat.mode & 0o400) == 0o400; // ... and user can read?
    } else if (Deno.gid() == stat.gid) {
      // User is in owner group
      return (stat.mode & 0o040) == 0o040; // ... and group can read?
    }
    return (stat.mode & 0o004) == 0o004; // Others can read?
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      return false; // Exclusive on Windows systems
    }
    throw error;
  }
}
