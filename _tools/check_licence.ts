#!/usr/bin/env -S deno run --allow-read
// Copyright 2022-2022 the Deno authors. All rights reserved. MIT license.

const EXTENSIONS = [".mjs", ".js", ".ts", ".rs"];
const EXCLUDED_PATHS = [
  ".git",
  "node/_module",
  "dotenv/testdata",
  "fs/testdata",
  "http/testdata",
  "node/_module/cjs",
  "node/_module/node_modules",
  "node/_tools",
  "node/testdata",
];

const ROOT = new URL("../", import.meta.url).pathname.slice(0, -1);
const FAIL_FAST = Deno.args.includes("--fail-fast");

const COPYRIGHT_REGEX =
  /\/\/ Copyright \d{4}-\d{4} (the )?Deno authors. All rights reserved. MIT license./;

let shouldFail = false;

function walk(dir: string) {
  for (const x of Deno.readDirSync(dir)) {
    const filePath = `${dir}/${x.name}`;

    if (x.isDirectory) {
      walk(filePath);
      continue;
    }

    const isExcluded = EXCLUDED_PATHS
      .map((x) => filePath.includes(x))
      .some((x) => x);
    if (
      isExcluded ||
      !EXTENSIONS.map((x) => filePath.endsWith(x)).some((x) => x)
    ) {
      continue;
    }

    const content = Deno.readTextFileSync(filePath);
    const hasNotice = content
      .split("\n")
      .filter((_, i) => i < 10)
      .map((x) => COPYRIGHT_REGEX.test(x))
      .some((x) => x);

    if (!hasNotice) {
      console.error(`Missing Copyright Notice: ${filePath}`);
      if (FAIL_FAST) Deno.exit(1);
      shouldFail = true;
    }
  }
}

walk(ROOT);
if (shouldFail) Deno.exit(1);
