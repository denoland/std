// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * This module is used as an entry point for test files utilizing the cluster
 * module which forks processes and cannot use `.ts` files due to
 * incompatibility with Deno's Node module resolution.
 * See https://github.com/denoland/deno/blob/main/cli/node/mod.rs#L725
 *
 * The idea is to emulate a CommonJS environment without having to modify
 * the test files in any way
 *
 * Running with all permissions and unstable is recommended
 *
 * Usage: `deno run -A --unstable require.mjs my_commonjs_file.js`
 */

import "./require.ts";
