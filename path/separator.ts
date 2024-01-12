// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";

/**
 * @deprecated (will be removed in 1.0.0) Use "separator" in https://deno.land/std@$STD_VERSION/path/constants.ts instead.
 */
export const SEP: "/" | "\\" = isWindows ? "\\" : "/";
/**
 * @deprecated (will be removed in 1.0.0) Use "separatorPattern" in https://deno.land/std@$STD_VERSION/path/constants.ts instead.
 */
export const SEP_PATTERN: RegExp = isWindows ? /[\\/]+/ : /\/+/;
