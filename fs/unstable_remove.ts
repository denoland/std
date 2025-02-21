// Copyright 2018-2025 the Deno authors. MIT license.

import type { RemoveOptions } from "./unstable_types.ts";
import { getNodeFs, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";

/**
 * Removes the named file or directory.
 *
 * Throws error if permission denied, path not found, or path is a non-empty directory and
 * the recursive option isn't set to true.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts
 * import { assert } from "@std/assert";
 * import { exists } from "@std/fs/exists";
 * import { remove } from "@std/fs/unstable-remove";
 * import { makeTempDir } from "@std/fs/unstable-make-temp-dir.ts";
 *
 * const tempDir = await makeTempDir({ prefix: "remove_async_" });
 * const existed = await exists(tempDir);
 * assert(existed === true);
 *
 * await remove(tempDir);
 * const existedAgain = await exists(tempDir);
 * assert(existedAgain === false);
 * ```
 *
 * @tags allow-write
 *
 * @param path The path of file or directory.
 * @param options Options when reading a file. See {@linkcode RemoveOptions}.
 */
export async function remove(
  path: string | URL,
  options?: RemoveOptions,
) {
  if (isDeno) {
    await Deno.remove(path, options);
  } else {
    try {
      await getNodeFs().promises.rm(path, options);
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously removes the named file or directory.
 *
 * Throws error if permission denied, path not found, or path is a non-empty directory and
 * the recursive option isn't set to true.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts
 * import { assert } from "@std/assert";
 * import { existsSync } from "@std/fs/exists";
 * import { removeSync } from "@std/fs/unstable-remove";
 * import { makeTempDirSync } from "@std/fs/unstable-make-temp-dir";
 *
 * const tempDir = makeTempDirSync({ prefix: "remove_sync_" });
 * assert(existSync(tempDir) === true);
 *
 * removeSync(tempDir);
 *
 * assert(existSync(tempDir) === false);
 * ```
 *
 * @tags allow-write
 *
 * @param path The path of file or directory.
 * @param options Options when reading a file. See {@linkcode RemoveOptions}.
 */
export function removeSync(
  path: string | URL,
  options?: RemoveOptions,
) {
  if (isDeno) {
    Deno.removeSync(path, options);
  } else {
    try {
      getNodeFs().rmSync(path, options);
    } catch (error) {
      throw mapError(error);
    }
  }
}
