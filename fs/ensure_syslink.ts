// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import * as path from "./path/mod.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { exists, existsSync } from "./exists.ts";
/**
 * Ensures that the link exists.
 * If the directory structure does not exist, it is created.
 * @export
 * @param {string} src
 * @param {string} dest
 * @returns {Promise<void>}
 */
export async function ensureSyslink(src: string, dest: string): Promise<void> {
  src = path.resolve(src);
  dest = path.resolve(dest);

  const srcStat = await Deno.lstat(src);

  if (await exists(dest)) {
    return;
  }

  await ensureDir(path.dirname(dest));

  await Deno.symlink(src, dest, srcStat.isDirectory() ? "dir" : "file");
}

/**
 * Ensures that the link exists.
 * If the directory structure does not exist, it is created.
 * @export
 * @param {string} src
 * @param {string} dest
 * @returns {void}
 */
export function ensureSyslinkSync(src: string, dest: string): void {
  src = path.resolve(src);
  dest = path.resolve(dest);

  const srcStat = Deno.lstatSync(src);

  if (existsSync(dest)) {
    return;
  }

  ensureDirSync(path.dirname(dest));

  Deno.symlinkSync(src, dest, srcStat.isDirectory() ? "dir" : "file");
}
