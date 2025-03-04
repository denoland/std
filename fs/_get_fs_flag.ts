// Copyright 2018-2025 the Deno authors. MIT license.

import { getNodeFs } from "./_utils.ts";
import type { WriteFileOptions } from "./unstable_types.ts";

type WriteBooleanOptions = Pick<
  WriteFileOptions,
  "append" | "create" | "createNew"
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
