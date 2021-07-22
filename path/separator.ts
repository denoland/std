// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "../_util/os.ts";

export const SEP = isWindows ? "\\" : "/";
export const SEP_PATTERN = isWindows ? /[\\/]+/ : /\/+/;
export const LIST_SEP = isWindows ? ";" : ":";

export function splitList(path: string): string[] {
  if (path === "") {
    return [];
  }
  return path.split(LIST_SEP);
}
