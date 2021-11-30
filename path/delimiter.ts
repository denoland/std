// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "../_util/os.ts";

export const delimiters = {
  win32: ";",
  posix: ":",
};

export const delimiter = isWindows ? delimiters.win32 : delimiters.posix;
