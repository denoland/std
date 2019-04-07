// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/**
 * Removes the named file or directory.
 * always recursively delete directories.
 * @param path the filepath will be remove
 */
export async function remove(path: string): Promise<void> {
  await Deno.remove(path, { recursive: true });
}

/**
 * Removes the named file or directory synchronously.
 * always recursively delete directories.
 * @param path the filepath will be remove
 */
export function removeSync(path: string): void {
  Deno.removeSync(path, { recursive: true });
}
