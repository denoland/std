// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import * as path from "../path/mod.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { getFileInfoType, toPathString } from "./_util.ts";
import { isWindows } from "../_util/os.ts";

export function resolveSymlinkSrc(src: string, dest: string): string;
export function resolveSymlinkSrc(src: URL, dest: URL): URL;
export function resolveSymlinkSrc(src: string | URL, dest: string | URL) {
  if (typeof src == "string" && typeof dest == "string") {
    return path.resolve(path.dirname(dest), src);
  } else {
    return new URL(src, dest)
  }
}

/**
 * Ensures that the link exists.
 * If the directory structure does not exist, it is created.
 *
 * @param src the source file path
 * @param dest the destination link path
 */
export function ensureSymlink(src: string, dest: string);
export function ensureSymlink(src: URL, dest: URL);
export function ensureSymlink(src: any, dest: any) {
  const srcReal = resolveSymlinkSrc(src, dest);
  const srcStatInfo = await Deno.lstat(srcReal);
  const srcFilePathType = getFileInfoType(srcStatInfo);

  await ensureDir(path.dirname(toPathString(dest)));

  const options: Deno.SymlinkOptions | undefined = isWindows
    ? {
      type: srcFilePathType === "dir" ? "dir" : "file",
    }
    : undefined;

  try {
    await Deno.symlink(src, dest, options);
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

/**
 * Ensures that the link exists.
 * If the directory structure does not exist, it is created.
 *
 * @param src the source file path
 * @param dest the destination link path
 */
export function ensureSymlinkSync(src: string, dest: string);
export function ensureSymlinkSync(src: URL, dest: URL);
export function ensureSymlinkSync(src: any, dest: any) {
  const srcReal = resolveSymlinkSrc(src, dest);
  const srcStatInfo = Deno.lstatSync(srcReal);
  const srcFilePathType = getFileInfoType(srcStatInfo);

  ensureDirSync(path.dirname(toPathString(dest)));

  const options: Deno.SymlinkOptions | undefined = isWindows
    ? {
      type: srcFilePathType === "dir" ? "dir" : "file",
    }
    : undefined;

  try {
    Deno.symlinkSync(src, dest, options);
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}
