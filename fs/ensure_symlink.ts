// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import * as path from "./path/mod.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { exists, existsSync } from "./exists.ts";
/**
 * Ensures that the link exists.
 * If the directory structure does not exist, it is created.
 * @param src the source file path
 * @param dest the destination link path
 * @param type only available on `Windows` (ignored on other platforms).
 */
export async function ensureSymlink(
  src: string,
  dest: string,
  type?: "dir" | "file"
): Promise<void> {
  src = path.resolve(src);
  dest = path.resolve(dest);

  await Deno.lstat(src);

  if (await exists(dest)) {
    return;
  }

  await ensureDir(path.dirname(dest));

  await Deno.symlink(src, dest, type);
}

/**
 * Ensures that the link exists.
 * If the directory structure does not exist, it is created.
 * @param src the source file path
 * @param dest the destination link path
 * @param type only available on `Windows` (ignored on other platforms).
 */
export function ensureSymlinkSync(
  src: string,
  dest: string,
  type?: "dir" | "file"
): void {
  src = path.resolve(src);
  dest = path.resolve(dest);

  Deno.lstatSync(src);

  if (existsSync(dest)) {
    return;
  }

  ensureDirSync(path.dirname(dest));

  Deno.symlinkSync(src, dest, type);
}
