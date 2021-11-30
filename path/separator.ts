// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "../_util/os.ts";

export const separators = {
  win32: "\\",
  posix: "/",
};

export const separator = isWindows ? separators.win32 : separators.posix;

export const SEP = separator;
export const SEP_PATTERN = isWindows ? /[\\/]+/ : /\/+/;
