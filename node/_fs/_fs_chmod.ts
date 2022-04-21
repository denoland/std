// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import type { CallbackWithError } from "./_fs_common.ts";
import { getValidatedPath } from "../internal/fs/utils.mjs";
import * as pathModule from "../../path/mod.ts";
import { parseFileMode } from "../internal/validators.mjs";
import { Buffer } from "../buffer.ts";

export function chmod(
  path: string | Buffer | URL,
  mode: string | number,
  callback: CallbackWithError,
): void {
  path = getValidatedPath(path).toString();
  mode = parseFileMode(mode, "mode");

  Deno.chmod(pathModule.toNamespacedPath(path), mode).then(
    () => callback(null),
    callback,
  );
}

export function chmodSync(path: string | URL, mode: string | number): void {
  path = getValidatedPath(path).toString();
  mode = parseFileMode(mode, "mode");

  Deno.chmodSync(pathModule.toNamespacedPath(path), mode);
}
