// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { walk } from "../fs/walk.ts";
import { globToRegExp } from "../path/glob_to_regexp.ts";
import { basename, dirname, parse } from "../path/mod.ts";
import { toCamelCase } from "../text/to_camel_case.ts";
import * as colors from "../fmt/colors.ts";

const EXTENSIONS = [".mjs", ".js", ".ts"];
const EXCLUDED_DIRS = [
  "**/mod.ts",
  "**/_*.ts",
  "**/*_test.ts",
  "**/test.ts",
  "**/_*/**",
  "**/testdata/**",
  "**/.git",
  "**/docs/**",

  "**/types.ts",
  "**/constants.ts",

  "**/dotenv/load.ts",
  "**/fmt/",
  "**/encoding/",
  "**/testing/",
  "**/http/",
  "**/uuid/",
];

const ROOT = new URL("../", import.meta.url);
let failed = false;

for await (
  const { path } of walk(ROOT, {
    exts: EXTENSIONS,
    skip: EXCLUDED_DIRS.map((path) => globToRegExp(path)),
    includeDirs: false,
  })
) {
  const module = await import(path);
  const p = parse(path);
  const dir = basename(dirname(path));

  const name = toCamelCase(p.name);
  const exports = Object.keys(module);

  const exp = exports.find((it) => {
    return it.toLowerCase() === name.toLowerCase() ||
      it.toLowerCase() === dir + name.toLowerCase(); // check if export is prefixed with module name e.g. CsvParseStream in `parse_stream.ts`
  });
  if (!exp) {
    failed = true;
    console.warn(
      `${colors.yellow("Warn")} ${path} does not export '${name}'.`,
    );
  }
}

if (failed) {
  // console.info(`Copyright header should be "${COPYRIGHT}"`);
  Deno.exit(1);
}
