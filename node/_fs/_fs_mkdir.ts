// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import type { CallbackWithError } from "./_fs_common.ts";
import { getValidatedPath } from "../internal/fs/utils.js";
import {
  denoErrorToNodeError,
} from "../internal/errors.ts";

/**
 * TODO: Also accept 'path' parameter as a Node polyfill Buffer type once these
 * are implemented. See https://github.com/denoland/deno/issues/3403
 */
type MkdirOptions =
  | { recursive?: boolean; mode?: number | undefined }
  | number
  | boolean;

export function mkdir(
  path: string | URL,
  options?: MkdirOptions | CallbackWithError,
  callback?: CallbackWithError,
): void {
  const normalizedPath = getValidatedPath(path).toString();

  let mode = 0o777;
  let recursive = false;

  if (typeof options == "function") {
    callback = options;
  } else if (typeof options === "number") {
    mode = options;
  } else if (typeof options === "boolean") {
    recursive = options;
  } else if (options) {
    if (options.recursive !== undefined) recursive = options.recursive;
    if (options.mode !== undefined) mode = options.mode;
  }
  if (typeof recursive !== "boolean") {
    throw new Deno.errors.InvalidData(
      "invalid recursive option , must be a boolean",
    );
  }
  Deno.mkdir(normalizedPath, { recursive, mode })
    .then(() => {
      if (typeof callback === "function") {
        callback(null);
      }
    }, (err: unknown) => {
      if (typeof callback === "function") {
        callback(
          err instanceof Error
            ? denoErrorToNodeError(err, { syscall: "mkdir", path: normalizedPath, })
            : err,
        );
      }
    });
}

export function mkdirSync(path: string | URL, options?: MkdirOptions): void {
  const normalizedPath = getValidatedPath(path).toString();
  let mode = 0o777;
  let recursive = false;

  if (typeof options === "number") {
    mode = options;
  } else if (typeof options === "boolean") {
    recursive = options;
  } else if (options) {
    if (options.recursive !== undefined) recursive = options.recursive;
    if (options.mode !== undefined) mode = options.mode;
  }
  if (typeof recursive !== "boolean") {
    throw new Deno.errors.InvalidData(
      "invalid recursive option , must be a boolean",
    );
  }

  try {
    Deno.mkdirSync(normalizedPath, { recursive, mode });
  } catch (err: unknown) {
    throw (err instanceof Error
      ? denoErrorToNodeError(err, { syscall: "mkdir", path: normalizedPath })
      : err);
  }
}
