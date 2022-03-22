// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import * as DenoUnstable from "../../_deno_unstable.ts";
import { type CallbackWithError, makeCallback } from "./_fs_common.ts";
import { fs, os } from "../internal_binding/constants.ts";
import { getValidatedPath, getValidMode } from "../internal/fs/utils.mjs";
import type { Buffer } from "../buffer.ts";

export function access(
  path: string | Buffer | URL,
  mode: number | CallbackWithError,
  callback?: CallbackWithError,
): void {
  if (typeof mode === "function") {
    callback = mode;
    mode = fs.F_OK;
  }

  path = getValidatedPath(path).toString();
  mode = getValidMode(mode, "access");
  const cb = makeCallback(callback);

  Deno.lstat(path).then((info) => {
    const m = +mode || 0;
    let fileMode = +info.mode! || 0;
    if (Deno.build.os !== "windows" && info.uid === DenoUnstable.getUid()) {
      // If the user is the owner of the file, then use the owner bits of
      // the file permission
      fileMode >>= 6;
    }
    // TODO(kt3k): Also check the case when the user belong to the group
    // of the file
    if ((m & fileMode) === m) {
      // all required flags exist
      cb(null);
    } else {
      // some required flags don't
      // deno-lint-ignore no-explicit-any
      const e: any = new Error(`EACCES: permission denied, access '${path}'`);
      e.path = path;
      e.syscall = "access";
      e.errno = os.errno.EACCES;
      e.code = "EACCES";
      cb(e);
    }
  }, (err) => {
    if (err instanceof Deno.errors.NotFound) {
      // deno-lint-ignore no-explicit-any
      const e: any = new Error(
        `ENOENT: no such file or directory, access '${path}'`,
      );
      e.path = path;
      e.syscall = "access";
      e.errno = os.errno.ENOENT;
      e.code = "ENOENT";
      cb(e);
    } else {
      cb(err);
    }
  });
}

export function accessSync(path: string | Buffer | URL, mode?: number): void {
  path = getValidatedPath(path).toString();
  mode = getValidMode(mode, "access");
  try {
    const info = Deno.lstatSync(path.toString());
    const m = +mode! || 0;
    const fileMode = +info.mode! || 0;
    // FIXME(kt3k): use the last digit of file mode as its mode for now
    // This is not correct if the user is the owner of the file
    // or is a member of the owner group
    if ((m & fileMode) === m) {
      // all required flags exist
    } else {
      // some required flags don't
      // deno-lint-ignore no-explicit-any
      const e: any = new Error(`EACCES: permission denied, access '${path}'`);
      e.path = path;
      e.syscall = "access";
      e.errno = os.errno.EACCES;
      e.code = "EACCES";
      throw e;
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      // deno-lint-ignore no-explicit-any
      const e: any = new Error(
        `ENOENT: no such file or directory, access '${path}'`,
      );
      e.path = path;
      e.syscall = "access";
      e.errno = os.errno.ENOENT;
      e.code = "ENOENT";
      throw e;
    } else {
      throw err;
    }
  }
}
