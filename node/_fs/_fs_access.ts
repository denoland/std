// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { makeCallback } from "./_fs_common.ts";
import { fs } from "../internal_binding/constants.ts";
import { getValidatedPath, getValidMode } from "../internal/fs/utils.js";
import { Buffer } from "../buffer.ts";

export function access(
  path: string | Buffer | URL,
  mode: number | ((...args: unknown[]) => void),
  callback?: (...args: unknown[]) => void,
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
    const fileMode = +info.mode! || 0;
    // FIXME(kt3k): use the last digit of file mode as its mode for now
    // This is not correct if the user is the owner of the file
    // or is a member of the owner group
    if ((m & fileMode) === m) {
      // all required flags exist
      cb(null);
    } else {
      // some required flags don't
      const e = new Error("no enough access for " + path);
      // deno-lint-ignore no-explicit-any
      (e as any).code = "ENOENT";
      // deno-lint-ignore no-explicit-any
      (e as any).path = path;
      cb(e);
    }
  }, (err) => {
    if (err instanceof Deno.errors.NotFound) {
      const e = new Error(
        `ENOENT: no such file or directory, access '${path}'`,
      );
      // deno-lint-ignore no-explicit-any
      (e as any).code = "ENOENT";
      // deno-lint-ignore no-explicit-any
      (e as any).path = path;
      // deno-lint-ignore no-explicit-any
      (e as any).syscall = "access";
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
      const e = new Error("no enough access for " + path);
      // deno-lint-ignore no-explicit-any
      (e as any).code = "ENOENT";
      // deno-lint-ignore no-explicit-any
      (e as any).path = path;
      throw e;
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      const e = new Error(
        `ENOENT: no such file or directory, access '${path}'`,
      );
      // deno-lint-ignore no-explicit-any
      (e as any).code = "ENOENT";
      // deno-lint-ignore no-explicit-any
      (e as any).path = path;
      // deno-lint-ignore no-explicit-any
      (e as any).syscall = "access";
      throw e;
    } else {
      throw err;
    }
  }
}
