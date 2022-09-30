// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { existsSync } from "../../fs/exists.ts";
import { getOpenOptions } from "./_fs_common.ts";
import { promisify } from "../internal/util.mjs";
import { parseFileMode } from "../internal/validators.mjs";
import { ERR_INVALID_ARG_TYPE } from "../internal/errors.ts";
import { getValidatedPath } from "../internal/fs/utils.mjs";
import type { Buffer } from "../buffer.ts";

export type openFlags =
  | "a"
  | "ax"
  | "a+"
  | "ax+"
  | "as"
  | "as+"
  | "r"
  | "r+"
  | "rs+"
  | "w"
  | "wx"
  | "w+"
  | "wx+";

type openCallback = (err: Error | null, fd: number) => void;

function convertFlagAndModeToOptions(
  flag?: openFlags,
  mode?: number,
): Deno.OpenOptions | undefined {
  if (!flag && !mode) return undefined;
  if (!flag && mode) return { mode };
  return { ...getOpenOptions(flag), mode };
}

export function open(path: string | Buffer | URL, callback: openCallback): void;
export function open(
  path: string | Buffer | URL,
  flags: openFlags,
  callback: openCallback,
): void;
export function open(
  path: string | Buffer | URL,
  flags: openFlags,
  mode: number,
  callback: openCallback,
): void;
export function open(
  path: string | Buffer | URL,
  flagsOrCallback: openCallback | openFlags,
  callbackOrMode?: openCallback | number,
  maybeCallback?: openCallback,
) {
  if (flagsOrCallback === undefined) {
    throw new ERR_INVALID_ARG_TYPE(
      "flags or callback",
      ["string", "function"],
      flagsOrCallback,
    );
  }
  let flags = typeof flagsOrCallback === "string" ? flagsOrCallback : undefined;
  const callback = typeof flagsOrCallback === "function"
    ? flagsOrCallback
    : typeof callbackOrMode === "function"
    ? callbackOrMode
    : maybeCallback;
  const mode = typeof callbackOrMode === "function"
    ? parseFileMode(null, "mode", 0o666)
    : parseFileMode(callbackOrMode, "mode", 0o666);

  path = getValidatedPath(path);

  if (typeof callback !== "function") {
    throw new ERR_INVALID_ARG_TYPE(
      "callback",
      "function",
      callback,
    );
  }

  if (flags === undefined) {
    flags = "r";
  }

  if (
    ["ax", "ax+", "wx", "wx+"].includes(flags || "") &&
    existsSync(path as string)
  ) {
    const err = new Error(`EEXIST: file already exists, open '${path}'`);
    (callback as (err: Error) => void)(err);
  } else {
    if (flags === "as" || flags === "as+") {
      let err: Error | null = null, res: number;
      try {
        res = openSync(path, flags, mode);
      } catch (error) {
        err = error instanceof Error ? error : new Error("[non-error thrown]");
      }
      if (err) {
        (callback as (err: Error) => void)(err);
      } else {
        callback(null, res!);
      }
      return;
    }
    Deno.open(path as string, convertFlagAndModeToOptions(flags, mode)).then(
      (file) => callback(null, file.rid),
      (err) => (callback as (err: Error) => void)(err),
    );
  }
}

export const openPromise = promisify(open) as (
  & ((path: string | Buffer | URL) => Promise<number>)
  & ((path: string | Buffer | URL, flags: openFlags) => Promise<number>)
  & ((path: string | Buffer | URL, mode?: number) => Promise<number>)
  & ((
    path: string | Buffer | URL,
    flags?: openFlags,
    mode?: number,
  ) => Promise<number>)
);

export function openSync(path: string | Buffer | URL): number;
export function openSync(
  path: string | Buffer | URL,
  flags?: openFlags,
): number;
export function openSync(path: string | Buffer | URL, mode?: number): number;
export function openSync(
  path: string | Buffer | URL,
  flags?: openFlags,
  mode?: number,
): number;
export function openSync(
  path: string | Buffer | URL,
  flagsOrMode?: openFlags | number,
  maybeMode?: number,
) {
  let flags = typeof flagsOrMode === "string" ? flagsOrMode : undefined;
  let mode = typeof flagsOrMode === "string"
    ? parseFileMode(null, "mode", 0o666)
    : parseFileMode(flagsOrMode, "mode", 0o666);
  if (maybeMode !== undefined) {
    mode = parseFileMode(maybeMode, "mode", 0o666);
  }
  path = getValidatedPath(path);

  if (flags === undefined) {
    flags = "r";
  }

  if (
    ["ax", "ax+", "wx", "wx+"].includes(flags || "") &&
    existsSync(path as string)
  ) {
    throw new Error(`EEXIST: file already exists, open '${path}'`);
  }

  return Deno.openSync(path as string, convertFlagAndModeToOptions(flags, mode))
    .rid;
}
