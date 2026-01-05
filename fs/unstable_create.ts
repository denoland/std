// Copyright 2018-2026 the Deno authors. MIT license.

import { isDeno } from "./_utils.ts";
import { mapError } from "./_map_error.ts";
import { open, openSync } from "./unstable_open.ts";
import type { FsFile } from "./unstable_types.ts";

/**
 * Creates a file if none exists or truncates an existing file and resolves to
 * an instance of {@linkcode FsFile}.
 *
 * Requires `allow-read` and `allow-write` permissions.
 *
 * @example Usage
 * ```ts ignore
 * import { create } from "@std/fs/unstable-create";
 * const file = await create("/foo/bar.txt");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path to the newly created file.
 * @returns A promise that resolves to a {@linkcode FsFile} instance.
 */
export async function create(path: string | URL): Promise<FsFile> {
  if (isDeno) {
    return Deno.create(path);
  } else {
    try {
      return await open(path, { create: true, write: true, truncate: true });
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Creates a file if none exists or truncates an existing file and returns
 * an instance of {@linkcode FsFile}.
 *
 * Requires `allow-read` and `allow-write` permissions.
 *
 * @example Usage
 * ```ts ignore
 * import { createSync } from "@std/fs/unstable-create";
 * const file = createSync("/foo/bar.txt");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path to the newly created file.
 * @returns A {@linkcode FsFile} instance.
 */
export function createSync(path: string | URL): FsFile {
  if (isDeno) {
    return Deno.createSync(path);
  } else {
    try {
      return openSync(path, { create: true, write: true, truncate: true });
    } catch (error) {
      throw mapError(error);
    }
  }
}
