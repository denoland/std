// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

/**
 * Test whether or not the given path is readable directory by checking with the file system.
 *
 * Note: do not use this function if performing a check before another operation on that file. Doing so creates a race condition. Instead, perform the actual file operation directly.
 *
 * Bad:
 * ```ts
 * import { isReadableDir } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * if (await isReadableDir("./foo")) {
 *   await Deno.remove("./foo");
 * }
 * ```
 *
 * Good:
 * ```ts
 * // Notice no use of isReadableDir
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
export async function isReadableDir(dirPath: string | URL): Promise<boolean> {
  try {
    const stat: Deno.FileInfo = await Deno.stat(dirPath);
    if (!stat.isDirectory) {
      return false;
    }
    if (stat.mode == null) {
      return true; // Non POSIX exclusive
    }
    if (Deno.getUid() == stat.uid) {
      return (stat.mode & 0o400) == 0o400;
    } else if (Deno.getGid() == stat.gid) {
      return (stat.mode & 0o040) == 0o040;
    }
    return (stat.mode & 0o004) == 0o004;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      return false; // Windows exclusive
    }
    throw error;
  }
}

/**
 * Test whether or not the given path is readable directory by checking with the file system.
 *
 * Note: do not use this function if performing a check before another operation on that file. Doing so creates a race condition. Instead, perform the actual file operation directly.
 *
 * Bad:
 * ```ts
 * import { isReadableDirSync } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * if (isReadableDirSync("./foo")) {
 *   Deno.removeSync("./foo");
 * }
 * ```
 *
 * Good:
 * ```ts
 * // Notice no use of isReadableDirSync
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
export function isReadableDirSync(dirPath: string | URL): boolean {
  try {
    const stat: Deno.FileInfo = Deno.statSync(dirPath);
    if (!stat.isDirectory) {
      return false;
    }
    if (stat.mode == null) {
      return true; // Non POSIX exclusive
    }
    if (Deno.getUid() == stat.uid) {
      return (stat.mode & 0o400) == 0o400;
    } else if (Deno.getGid() == stat.gid) {
      return (stat.mode & 0o040) == 0o040;
    }
    return (stat.mode & 0o004) == 0o004;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      return false; // Windows exclusive
    }
    throw error;
  }
}
