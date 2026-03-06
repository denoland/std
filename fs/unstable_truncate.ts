// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";

/**
 * Truncates (or extends) the specified file, to reach the specified `len`. If
 * `len` is not specified then the entire file contents are truncated.
 *
 * Requires `allow-write` permission.
 *
 * @example Truncate file to 0 bytes
 * ```ts ignore
 * import { truncate } from "@std/fs/unstable-truncate";
 * await truncate("my_file.txt");
 * ```
 *
 * @example Truncate part of a file
 * ```ts ignore
 * import { makeTempFile } from "@std/fs/unstable-make-temp-file";
 * import { readFile } from "@std/fs/unstable-read-file";
 * import { truncate } from "@std/fs/unstable-truncate";
 * import { writeTextFile } from "@std/fs/unstable-write-text-file";
 *
 * const file = await makeTempFile();
 * await writeTextFile(file, "Hello World");
 * await truncate(file, 7);
 * const data = await readFile(file);
 * console.log(new TextDecoder().decode(data));  // "Hello W"
 * ```
 *
 * @tags allow-write
 *
 * @param name The name/path to the file.
 * @param len An optional value that sets the new size of the file. Omitting this argument sets the file size to 0 bytes.
 */
export async function truncate(name: string, len?: number): Promise<void> {
  if (isDeno) {
    await Deno.truncate(name, len);
  } else {
    try {
      await getNodeFs().promises.truncate(name, len);
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously truncates (or extends) the specified file, to reach the
 * specified `len`. If `len` is not specified then the entire file contents are
 * truncated.
 *
 * Requires `allow-write` permission.
 *
 * @example Truncate file to 0 bytes
 * ```ts ignore
 * import { truncateSync } from "@std/fs/unstable-truncate";
 * truncateSync("my_file.txt");
 * ```
 *
 * @example Truncate part of a file
 * ```ts ignore
 * import { makeTempFileSync } from "@std/fs/unstable-make-temp-file";
 * import { readFileSync } from "@std/fs/unstable-read-file";
 * import { truncateSync } from "@std/fs/unstable-truncate";
 * import { writeFileSync } from "@std/fs/unstable-write-file";
 *
 * const file = makeTempFileSync();
 * writeFileSync(file, new TextEncoder().encode("Hello World"));
 * truncateSync(file, 7);
 * const data = readFileSync(file);
 * console.log(new TextDecoder().decode(data));
 * ```
 *
 * @tags allow-write
 *
 * @param name The name/path to the file.
 * @param len An optional value that sets the new size of the file. Omitting this argument sets the file size to 0 bytes.
 */
export function truncateSync(name: string, len?: number): void {
  if (isDeno) {
    Deno.truncateSync(name, len);
  } else {
    try {
      getNodeFs().truncateSync(name, len);
    } catch (error) {
      throw mapError(error);
    }
  }
}
