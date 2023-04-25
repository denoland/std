// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

// NOTE: This file exists to break circular referencecs; it should NOT be
// imported directly, outside of the "std/path" module.

import { isWindows } from "../_util/os.ts";
import { sep as win32Sep } from "./win32.ts";
import { sep as posixSep } from "./posix.ts";

export const SEP = isWindows ? win32Sep : posixSep;
export const SEP_PATTERN = isWindows ? /[\\/]+/ : /\/+/;
