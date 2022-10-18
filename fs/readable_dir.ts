// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

/**
 * Test whether or not the given path is readable directory by checking with the file system.
 *
 * Note: do not use this function if performing a check before another operation on that file. Doing so creates a race condition. Instead, perform the actual file operation directly.
 *
 * Bad:
 * ```ts
 * import { readableDir } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * if (await readableDir("./foo")) {
 *   await Deno.remove("./foo");
 * }
 * ```
 *
 * Good:
 * ```ts
 * // Notice no use of readableDir
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
export async function readableDir(dirPath: string | URL): Promise<boolean> {
  try {
    return (await Deno.stat(dirPath)).isDirectory;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
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
 * import { readableDirSync } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * if (readableDirSync("./foo")) {
 *   Deno.removeSync("./foo");
 * }
 * ```
 *
 * Good:
 * ```ts
 * // Notice no use of readableDirSync
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
export function readableDirSync(dirPath: string | URL): boolean {
  try {
    return Deno.statSync(dirPath).isDirectory;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}
