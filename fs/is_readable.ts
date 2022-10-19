// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

/**
 * Test whether or not the given path is readable by checking with the file system. To check simultaneously if the path is either a file or a directory please use `isReadableFile` or `isReadableDir` instead.
 *
 * Note: do not use this function if performing a check before another operation on that file. Doing so creates a race condition. Instead, perform the actual file operation directly.
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
export async function isReadable(path: string | URL): Promise<boolean> {
  try {
    const stat: Deno.FileInfo = await Deno.stat(path);
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
export function isReadableSync(path: string | URL): boolean {
  try {
    const stat: Deno.FileInfo = Deno.statSync(path);
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
