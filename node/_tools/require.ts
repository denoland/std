// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { createRequire } from "../module.ts";
import { isAbsolute } from "../../path/mod.ts";

/**
 * This module is used as an entry point for each test file
 *
 * The idea is to emulate a CommonJS environment without having to modify
 * the test files in any way
 *
 * Running with all permissions and unstable is recommended
 *
 * Usage: `deno run -A --unstable require.ts my_commonjs_file.js`
 */

const file = Deno.args[0];
if (!file) {
  throw new Error("No file provided");
} else if (!isAbsolute(file)) {
  throw new Error("Path for file must be absolute");
}

const require = createRequire(file);
require(file);
