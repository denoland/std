// Copyright 2022-2022 the Deno authors. All rights reserved. MIT license.

import { VERSION } from "../version.ts";
import * as semver from "../semver/mod.ts";

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

const DEPRECATED_REGEX = /\*\s+@deprecated\s+(?<text>.+)/;
const DEPRECATION_FORMAT_REGEX =
  /^\(will be removed in (?<version>\d+\.\d+\.\d+)\)/;

let shouldFail = false;

// next
const DEFAULT_DEPRECATED_VERSION = semver.inc(
  semver.inc(
    semver.inc(
      VERSION,
      "minor",
    )!,
    "minor",
  )!,
  "minor",
);

const DEPRECATION_FORMAT = `(will be removed in ${DEFAULT_DEPRECATED_VERSION})`;

function compareVersion(version: string) {
  return semver.gt(version, VERSION);
}

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
    const lines = content.split("\n");
    let lineIndex = 1;
    for (const line of lines) {
      const match = DEPRECATED_REGEX.exec(line);
      if (match) {
        const text = match.groups?.text;
        if (!text) {
          console.error(
            `missing @deprecated text: ${filePath}:${lineIndex}`,
          );
          shouldFail = true;
          if (FAIL_FAST) Deno.exit(1);
          continue;
        }
        const { version } = DEPRECATION_FORMAT_REGEX.exec(text)?.groups || {};
        if (!version) {
          console.error(
            `missing deprecation version. Use '@deprecated ${DEPRECATION_FORMAT}' as format: ${filePath}:${lineIndex}`,
          );

          shouldFail = true;
          if (FAIL_FAST) Deno.exit(1);
          continue;
        }
        if (!compareVersion(version)) {
          console.error(
            `expired @deprecated tag. Remove deprecated export: ${filePath}:${lineIndex}`,
          );
          if (FAIL_FAST) Deno.exit(1);
          shouldFail = true;
          continue;
        }
      }
      lineIndex += 1;
    }
  }
}

walk(ROOT);
if (shouldFail) Deno.exit(1);
