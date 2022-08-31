// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import Dir from "./_fs_dir.ts";
import { Buffer } from "../buffer.ts";
import { assertEncoding, getValidatedPath } from "../internal/fs/utils.mjs";
import { denoErrorToNodeError } from "../internal/errors.ts";
import { validateFunction } from "../internal/validators.mjs";
import { promisify } from "../internal/util.mjs";

type Options = {
  encoding?: string;
  bufferSize?: number;
};
type Callback = (err?: Error | null, dir?: Dir) => void;

function _validateFunction(callback: unknown): asserts callback is Callback {
  validateFunction(callback, "callback");
}

/**
 * Required as `assertIntegerRange` from "../_utils.ts" throws `Error` instead of `RangeError`.
 * Node throws `RangeError` when this assertion fails.
 */
function checkBufferSize(value: number, name: string) {
  if (!Number.isInteger(value) || value < 1 || value > 4294967295) {
    throw new RangeError(
      `The value of "${name}" is out of range. It must be >= 1 && <= 4294967295. Received ${value}`,
    );
  }
}

/** @link https://nodejs.org/api/fs.html#fsopendirsyncpath-options */
export function opendir(
  path: string | Buffer | URL,
  options: Options | Callback,
  callback?: Callback,
) {
  callback = typeof options === "function" ? options : callback;
  _validateFunction(callback);

  path = getValidatedPath(path).toString();

  options = typeof options === "object" ? options : {};
  options = Object.assign({
    encoding: "utf8",
    bufferSize: 32,
  }, options);

  let err, dir;
  try {
    assertEncoding(options.encoding);

    checkBufferSize(options.bufferSize!, "options.bufferSize");

    /** Throws if path is invalid */
    Deno.readDirSync(path);

    dir = new Dir(path);
  } catch (error) {
    err = denoErrorToNodeError(error as Error, { syscall: "opendir" });
  }
  if (err) {
    callback(err);
  } else {
    callback(null, dir);
  }
}

/** @link https://nodejs.org/api/fs.html#fspromisesopendirpath-options */
export const opendirPromise = promisify(opendir) as (
  path: string | Buffer | URL,
  options?: Options,
) => Promise<Dir>;

export function opendirSync(
  path: string | Buffer | URL,
  options: Options = {
    encoding: "utf8",
    bufferSize: 32,
  },
): Dir {
  path = getValidatedPath(path).toString();

  options = Object.assign({
    encoding: "utf8",
    bufferSize: 32,
  }, options);

  try {
    assertEncoding(options.encoding);

    checkBufferSize(options.bufferSize!, "options.bufferSize");

    /** Throws if path is invalid */
    Deno.readDirSync(path);

    return new Dir(path);
  } catch (err) {
    throw denoErrorToNodeError(err as Error, { syscall: "opendir" });
  }
}
