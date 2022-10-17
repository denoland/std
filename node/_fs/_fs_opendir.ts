// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import Dir from "./_fs_dir.ts";
import { Buffer } from "../buffer.ts";
import { assertEncoding, getValidatedPath } from "../internal/fs/utils.mjs";
import { denoErrorToNodeError } from "../internal/errors.ts";
import { validateFunction, validateUint32 } from "../internal/validators.mjs";
import { promisify } from "../internal/util.mjs";

/** These options aren't funcitonally used right now, as `Dir` doesn't yet support them.
 * However, these values are still validated.
 */
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
  const encoding = options?.encoding ?? "utf8";
  const bufferSize = options?.bufferSize ?? 32;

  let err, dir;
  try {
    assertEncoding(encoding);

    checkBufferSize(bufferSize, "options.bufferSize");

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
  options?: Options,
): Dir {
  path = getValidatedPath(path).toString();

  let encoding: string;
  let bufferSize: number;
  if (options) {
    ({ encoding = "utf8", bufferSize = 32 } = options);
  } else {
    encoding = "utf8";
    bufferSize = 32;
  }

  validateUint32(bufferSize, "bufferSize", true);

  try {
    assertEncoding(encoding);

    checkBufferSize(bufferSize, "options.bufferSize");

    /** Throws if path is invalid */
    Deno.readDirSync(path);

    return new Dir(path);
  } catch (err) {
    throw denoErrorToNodeError(err as Error, { syscall: "opendir" });
  }
}
