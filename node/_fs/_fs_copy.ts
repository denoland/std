// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import type { CallbackWithError } from "./_fs_common.ts";
import { makeCallback } from "./_fs_common.ts";
import { Buffer } from "../buffer.ts";
import { getValidatedPath, getValidMode } from "../internal/fs/utils.js";
import { fs, os } from "../internal_binding/constants.ts";

export function copyFile(
  src: string | Buffer | URL,
  dest: string | Buffer | URL,
  callback: CallbackWithError,
): void;
export function copyFile(
  src: string | Buffer | URL,
  dest: string | Buffer | URL,
  mode: number,
  callback: CallbackWithError,
): void;
export function copyFile(
  src: string | Buffer | URL,
  dest: string | Buffer | URL,
  mode: number | CallbackWithError,
  callback?: CallbackWithError,
): void {
  if (typeof mode === "function") {
    callback = mode;
    mode = 0;
  }
  const srcStr = getValidatedPath(src, "src").toString();
  const destStr = getValidatedPath(dest, "dest").toString();
  const modeNum = getValidMode(mode, "copyFile");
  const cb = makeCallback(callback);

  if ((modeNum & fs.COPYFILE_EXCL) === fs.COPYFILE_EXCL) {
    Deno.lstat(destStr).then(() => {
      // deno-lint-ignore no-explicit-any
      const e: any = new Error(
        `EEXIST: file already exists, copyfile '${srcStr}' -> '${destStr}'`,
      );
      e.syscall = "copyfile";
      e.errno = os.errno.EEXIST;
      e.code = "EEXIST";
      cb(e);
    }, (e) => {
      if (e instanceof Deno.errors.NotFound) {
        Deno.copyFile(srcStr, destStr).then(() => cb(null), cb);
      }
      cb(e);
    });
  } else {
    Deno.copyFile(srcStr, destStr).then(() => cb(null), cb);
  }
}

export function copyFileSync(
  src: string | Buffer | URL,
  dest: string | Buffer | URL,
  mode?: number,
): void {
  const srcStr = getValidatedPath(src, "src").toString();
  const destStr = getValidatedPath(dest, "dest").toString();
  const modeNum = getValidMode(mode, "copyFile");

  if ((modeNum & fs.COPYFILE_EXCL) === fs.COPYFILE_EXCL) {
    try {
      Deno.lstatSync(destStr);
      throw new Error(`A file exists at the destination: ${destStr}`);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        Deno.copyFileSync(srcStr, destStr);
      }
      throw e;
    }
  } else {
    Deno.copyFileSync(srcStr, destStr);
  }
}
