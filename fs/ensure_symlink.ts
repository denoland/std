// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import * as path from "./path/mod.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { exists, existsSync } from "./exists.ts";
import { PathType, getFileInfoType } from "./utils.ts";
/**
 * Ensures that the link exists.
 * If the directory structure does not exist, it is created.
 *
 * @param src the source file path
 * @param dest the destination link path
 * @returns Promise<void>
 */
export async function ensureSymlink(src: string, dest: string): Promise<void> {
  src = path.resolve(src);
  dest = path.resolve(dest);

  const statInfo = await Deno.lstat(src);
  const filePathType = getFileInfoType(statInfo);

  if (await exists(dest)) {
    if (filePathType !== PathType.symlink) {
      throw new Error(
        `Ensure path exists, expected 'symlink', got '${filePathType}'`
      );
    }
    return;
  }

  await ensureDir(path.dirname(dest));

  await Deno.symlink(src, dest, filePathType || undefined);
}

/**
 * Ensures that the link exists.
 * If the directory structure does not exist, it is created.
 *
 * @param src the source file path
 * @param dest the destination link path
 * @returns void
 */
export function ensureSymlinkSync(src: string, dest: string): void {
  src = path.resolve(src);
  dest = path.resolve(dest);

  const statInfo = Deno.lstatSync(src);
  const filePathType = getFileInfoType(statInfo);

  if (existsSync(dest)) {
    if (filePathType !== PathType.symlink) {
      throw new Error(
        `Ensure path exists, expected 'symlink', got '${filePathType}'`
      );
    }
    return;
  }

  ensureDirSync(path.dirname(dest));

  Deno.symlinkSync(src, dest, filePathType || undefined);
}
