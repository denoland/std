// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

/**
 * Test whether or not the given path is a readable file by checking with the file system.
 *
 * Note: do not use this function if performing a check before another operation on that file. Doing so creates a race condition. Instead, perform the actual file operation directly.
 *
 * Bad:
 * ```ts
 * import { readableFile } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * if (await readableFile("./foo.txt")) {
 *   await Deno.remove("./foo.txt");
 * }
 * ```
 *
 * Good:
 * ```ts
 * // Notice no use of readableFile
 * try {
 *   await Deno.remove("./foo.txt");
 * } catch (error) {
 *   if (!(error instanceof Deno.errors.NotFound)) {
 *     throw error;
 *   }
 *   // Do nothing...
 * }
 * ```
 * @see https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
 */
export async function readableFile(filePath: string | URL): Promise<boolean> {
  try {
    return (await Deno.stat(filePath)).isFile;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

/**
 * Test whether or not the given path is a readable file by checking with the file system.
 *
 * Note: do not use this function if performing a check before another operation on that file. Doing so creates a race condition. Instead, perform the actual file operation directly.
 *
 * Bad:
 * ```ts
 * import { readableFileSync } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * if (readableFileSync("./foo.txt")) {
 *   Deno.removeSync("./foo.txt");
 * }
 * ```
 *
 * Good:
 * ```ts
 * // Notice no use of readableFileSync
 * try {
 *   Deno.removeSync("./foo.txt");
 * } catch (error) {
 *   if (!(error instanceof Deno.errors.NotFound)) {
 *     throw error;
 *   }
 *   // Do nothing...
 * }
 * ```
 * @see https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
 */
export function readableFileSync(filePath: string | URL): boolean {
  try {
    return Deno.statSync(filePath).isFile;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}
