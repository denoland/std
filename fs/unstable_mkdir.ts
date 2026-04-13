// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";

/**
 * Options which can be set when using {@linkcode mkdir} and
 * {@linkcode mkdirSync}.
 */
export interface MkdirOptions {
  /**
   * If set to `true`, means that any intermediate directories will also be
   * created (as with the shell command `mkdir -p`).
   *
   * Intermediate directories are created with the same permissions.
   *
   * When recursive is set to `true`, succeeds silently (without changing any
   * permissions) if a directory already exists at the path, or if the path
   * is a symlink to an existing directory.
   *
   * @default {false}
   */
  recursive?: boolean;
  /**
   * Permissions to use when creating the directory (defaults to `0o777`,
   * before the process's umask).
   *
   * Ignored on Windows.
   */
  mode?: number;
}

/**
 * Creates a new directory with the specified path.
 *
 * Defaults to throwing error if the directory already exists.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { mkdir } from "@std/fs/unstable-mkdir";
 * await mkdir("new_dir");
 * await mkdir("nested/directories", { recursive: true });
 * await mkdir("restricted_access_dir", { mode: 0o700 });
 * ```
 *
 * @tags allow-write
 *
 * @param path The path to the new directory.
 * @param options Options for creating directories.
 */
export async function mkdir(
  path: string | URL,
  options?: MkdirOptions,
): Promise<void> {
  if (isDeno) {
    await Deno.mkdir(path, { ...options });
  } else {
    try {
      await getNodeFs().promises.mkdir(path, { ...options });
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously creates a new directory with the specified path.
 *
 * Defaults to throwing error if the directory already exists.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { mkdirSync } from "@std/fs/unstable-mkdir";
 * mkdirSync("new_dir");
 * mkdirSync("nested/directories", { recursive: true });
 * mkdirSync("restricted_access_dir", { mode: 0o700 });
 * ```
 *
 * @tags allow-write
 *
 * @param path The path to the new directory.
 * @param options Options for creating directories.
 */
export function mkdirSync(path: string | URL, options?: MkdirOptions) {
  if (isDeno) {
    Deno.mkdirSync(path, { ...options });
  } else {
    try {
      getNodeFs().mkdirSync(path, { ...options });
    } catch (error) {
      throw mapError(error);
    }
  }
}
