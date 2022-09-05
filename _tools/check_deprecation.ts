// Copyright 2022-2022 the Deno authors. All rights reserved. MIT license.

import { VERSION } from "../version.ts";
import * as semver from "../semver/mod.ts";
import * as colors from "../fmt/colors.ts";

const EXTENSIONS = [".mjs", ".js", ".ts", ".rs"];
const EXCLUDED_PATHS = [
  ".git",
  "node/",
  "dotenv/testdata",
  "fs/testdata",
  "http/testdata",
];

console.warn(
  colors.yellow("Warning"),
  `ignore ${
    colors.green(`"fs/exists.ts"`)
  } until issue is resolved: https://github.com/denoland/deno_std/issues/2594`,
);
EXCLUDED_PATHS.push("fs/exists.ts");

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
            colors.red("Error"),
            `${
              colors.bold("@deprecated")
            } tag must have a version: ${filePath}:${lineIndex}`,
          );
          shouldFail = true;
          if (FAIL_FAST) Deno.exit(1);
          continue;
        }
        const { version } = DEPRECATION_FORMAT_REGEX.exec(text)?.groups || {};
        if (!version) {
          console.error(
            colors.red("Error"),
            `${
              colors.bold("@deprecated")
            } tag version is missing. Append '${DEPRECATION_FORMAT}' after @deprecated tag: ${filePath}:${lineIndex}`,
          );

          shouldFail = true;
          if (FAIL_FAST) Deno.exit(1);
          continue;
        }
        if (!compareVersion(version)) {
          console.error(
            colors.red("Error"),
            `${
              colors.bold("@deprecated")
            } tag is expired and export must be removed: ${filePath}:${lineIndex}`,
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
