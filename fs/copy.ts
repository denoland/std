// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import * as path from "./path/mod.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { isSubdir } from "./utils.ts";

export interface CopyOptions {
  /* overwrite existing file or directory, default is false */
  overwrite?: boolean;
}

/* copy file to dest */
async function copyFile(src: string, dest: string): Promise<void> {
  await Deno.copyFile(src, dest);
}

function copyFileSync(src: string, dest: string): void {
  Deno.copyFileSync(src, dest);
}

/* copy link to dest */
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function copyLink(src: string, dest: string): Promise<void> {
  let type = "";
  const originSrcFilePath = await Deno.readlink(src);
  if (Deno.platform.os === "win") {
    const srcStat = await Deno.stat(src);
    type = srcStat.isDirectory() ? "dir" : "file";
  }
  await Deno.symlink(originSrcFilePath, dest, type);
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function copyLinkSync(src: string, dest: string): void {
  let type = "";
  const originSrcFilePath = Deno.readlinkSync(src);
  if (Deno.platform.os === "win") {
    const srcStat = Deno.statSync(src);
    type = srcStat.isDirectory() ? "dir" : "file";
  }
  Deno.symlinkSync(originSrcFilePath, dest, type);
}

/* copy folder from src to dest. */
async function copyDir(src: string, dest: string): Promise<void> {
  const files = await Deno.readDir(src);
  await ensureDir(dest);
  for (const file of files) {
    const srcPath = file.path as string;
    const destPath = path.join(dest, path.basename(srcPath as string));
    if (file.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (file.isFile()) {
      await copyFile(srcPath, destPath);
    } else if (file.isSymlink()) {
      await copyLink(srcPath, destPath);
    }
  }
}

function copyDirSync(src: string, dest: string): void {
  const files = Deno.readDirSync(src);
  ensureDirSync(dest);
  for (const file of files) {
    const srcPath = file.path as string;
    const destPath = path.join(dest, path.basename(srcPath as string));
    if (file.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else if (file.isFile()) {
      copyFileSync(srcPath, destPath);
    } else if (file.isSymlink()) {
      copyLinkSync(srcPath, destPath);
    }
  }
}

/**
 * Copy a file or directory. The directory can have contents. Like `cp -r`.
 * @param src the file/directory path. Note that if `src` is a directory it will copy everything inside of this directory, not the entire directory itself
 * @param dest the destination path. Note that if `src` is a file, `dest` cannot be a directory
 * @param options
 */
export async function copy(
  src: string,
  dest: string,
  options: CopyOptions = {}
): Promise<void> {
  src = path.resolve(src);
  dest = path.resolve(dest);

  if (src === dest) {
    throw new Error("Source and destination must not be the same.");
  }

  const srcStat = await Deno.lstat(src);

  if (srcStat.isDirectory() && isSubdir(src, dest)) {
    throw new Error(
      `Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`
    );
  }

  const destStat = await Deno.lstat(dest).catch(() => null);

  async function destOverwriteCheck(): Promise<void> {
    // if dest exists
    if (destStat) {
      if (!options.overwrite) {
        throw new Error(`'${dest}' already exists`);
      }
      // if set overwrite option, dest should be remove whatever it's
      await Deno.remove(dest, { recursive: true });
    }
  }

  if (srcStat.isDirectory()) {
    // if dest exists
    if (destStat) {
      if (!destStat.isDirectory()) {
        throw new Error(
          `Cannot overwrite non-directory '${dest}' with directory '${src}'.`
        );
      }
      await destOverwriteCheck();
    }
    await copyDir(src, dest);
  } else if (srcStat.isFile()) {
    // if dest exists
    if (destStat) {
      await destOverwriteCheck();
    }
    await Deno.copyFile(src, dest);
  } else if (srcStat.isSymlink()) {
    // if dest exists
    if (destStat) {
      await destOverwriteCheck();
    }
    await copyLink(src, dest);
  }
}

/**
 * Copy a file or directory. The directory can have contents. Like `cp -r`.
 * @param src the file/directory path. Note that if `src` is a directory it will copy everything inside of this directory, not the entire directory itself
 * @param dest the destination path. Note that if `src` is a file, `dest` cannot be a directory
 * @param options
 */
export function copySync(
  src: string,
  dest: string,
  options: CopyOptions = {}
): void {
  src = path.resolve(src);
  dest = path.resolve(dest);

  if (src === dest) {
    throw new Error("Source and destination must not be the same.");
  }

  const srcStat = Deno.statSync(src);

  if (srcStat.isDirectory() && isSubdir(src, dest)) {
    throw new Error(
      `Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`
    );
  }

  let destStat: Deno.FileInfo | null;

  try {
    destStat = Deno.statSync(dest);
  } catch {
    destStat = null;
  }

  function destOverwriteCheck(): void {
    // if dest exists
    if (destStat) {
      if (!options.overwrite) {
        throw new Error(`'${dest}' already exists`);
      }
      // if set overwrite option, dest should be remove whatever it's
      Deno.removeSync(dest, { recursive: true });
    }
  }

  if (srcStat.isDirectory()) {
    // if dest exists
    if (destStat) {
      if (!destStat.isDirectory()) {
        throw new Error(
          `Cannot overwrite non-directory '${dest}' with directory '${src}'.`
        );
      }
      destOverwriteCheck();
    }
    copyDirSync(src, dest);
  } else if (srcStat.isFile()) {
    // if dest exists
    if (destStat) {
      destOverwriteCheck();
    }
    Deno.copyFileSync(src, dest);
  } else if (srcStat.isSymlink()) {
    // if dest exists
    if (destStat) {
      destOverwriteCheck();
    }
    copyLinkSync(src, dest);
  }
}
