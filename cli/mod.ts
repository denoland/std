// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * Tools for creating interactive command line tools.
 *
 * ```ts
 * import { parseArgs } from "@std/cli/parse-args";
 * import { assertEquals } from "@std/assert";
 *
 * // Same as running `deno run example.ts --foo --bar=baz ./quux.txt`
 * const args = parseArgs(["--foo", "--bar=baz", "./quux.txt"]);
 * assertEquals(args, { foo: true, bar: "baz", _: ["./quux.txt"] });
 * ```
 *
 * @module
 */

export * from "./parse_args.ts";
export * from "./prompt_secret.ts";
export * from "./unicode_width.ts";
