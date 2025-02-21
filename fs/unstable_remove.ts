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
 * ```ts ignore
 * import { assert } from "@std/assert";
 * import { remove } from "@std/fs/unstable-remove";
 *
 * await remove("/var/folders/tt/gd7mljws4_1bqsbpy9gdg6k40000gn/T");
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
 * ```ts ignore
 * import { assert } from "@std/assert";
 * import { removeSync } from "@std/fs/unstable-remove";
 *
 * await removeSync("/var/folders/tt/gd7mljws4_1bqsbpy9gdg6k40000gn/T");
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
