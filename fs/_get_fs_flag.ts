// Copyright 2018-2025 the Deno authors. MIT license.

import { getNodeFs } from "./_utils.ts";
import type { WriteFileOptions } from "./unstable_types.ts";
import type { OpenOptions } from "./unstable_open.ts";

type WriteBooleanOptions = Pick<
  WriteFileOptions,
  "append" | "create" | "createNew"
>;

type OpenBooleanOptions = Pick<
  OpenOptions,
  "read" | "write" | "append" | "truncate" | "create" | "createNew"
>;

/**
 * Uses the boolean options specified in {@linkcode WriteFileOptions} to
 * construct the composite flag value to pass to the `flag` option in the
 * Node.js `writeFile` function.
 */
export function getWriteFsFlag(opt: WriteBooleanOptions): number {
  const { O_APPEND, O_CREAT, O_EXCL, O_TRUNC, O_WRONLY } =
    getNodeFs().constants;

  let flag = O_WRONLY;
  if (opt.create) {
    flag |= O_CREAT;
  }
  if (opt.createNew) {
    flag |= O_EXCL;
  }
  if (opt.append) {
    flag |= O_APPEND;
  } else {
    flag |= O_TRUNC;
  }
  return flag;
}

/**
 * Uses the boolean options specified in {@linkcode OpenOptions} to construct the
 * composite flag value to pass to the `flag` option in the Node.js `open`
 * function.
 */
export function getOpenFsFlag(opt: OpenBooleanOptions): number {
  const { O_APPEND, O_CREAT, O_EXCL, O_WRONLY, O_RDONLY, O_RDWR, O_TRUNC } =
    getNodeFs().constants;

  if (
    !opt.read && !opt.write && !opt.append && !opt.truncate && !opt.create &&
    !opt.createNew
  ) {
    throw new Error("'options' requires at least one option to be true");
  }

  if (!opt.write && opt.truncate) {
    throw new Error("'truncate' option requires 'write' to be true");
  }

  if ((opt.create || opt.createNew) && !(opt.write || opt.append)) {
    throw new Error(
      "'create' or 'createNew' options require 'write' or 'append' to be true",
    );
  }

  // This error is added to match the Deno runtime. Deno throws a `TypeError`
  // (os error 22) for this OpenOption combo. Under Node.js, the bitmask
  // combinations of (O_RDWR | O_TRUNC | O_APPEND) and
  // (O_WRONLY | O_TRUNC | O_APPEND) to open files are valid.
  if (opt.write && opt.append && opt.truncate) {
    throw new TypeError("Invalid argument");
  }

  let flag = O_RDONLY;
  if (opt.read && !opt.write) {
    flag |= O_RDONLY;
  }

  if (opt.read && opt.write) {
    flag |= O_RDWR;
  }

  if (!opt.read && opt.write) {
    flag |= O_WRONLY;
  }

  if (opt.create || opt.createNew) {
    flag |= O_CREAT;
  }

  if (opt.createNew) {
    flag |= O_EXCL;
  }

  if (opt.append) {
    flag |= O_APPEND;
    if (!opt.read) {
      flag |= O_WRONLY;
    } else {
      flag |= O_RDWR;
    }
  }

  if (opt.truncate) {
    flag |= O_TRUNC;
  }

  return flag;
}
