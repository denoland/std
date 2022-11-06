// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { VERSION } from "../version.ts";
import * as semver from "../semver/mod.ts";
import * as colors from "../fmt/colors.ts";
import { doc } from "https://deno.land/x/deno_doc@0.46.0/mod.ts";

const EXTENSIONS = [".mjs", ".js", ".ts"];
const EXCLUDED_PATHS = [
  ".git",
  "node/",
  "dotenv/testdata",
  "fs/testdata",
  "http/testdata",
  "crypto/_wasm_crypto/target",
  "encoding/varint/_wasm/target",
  "hash/_wasm/target",
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

const DEPRECATION_IN_FORMAT_REGEX =
  /^\(will be removed in (?<version>\d+\.\d+\.\d+)\)/;
const DEPRECATION_AFTER_FORMAT_REGEX =
  /^\(will be removed after (?<version>\d+\.\d+\.\d+)\)/;

let shouldFail = false;

// add three minor version to current version
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

const DEPRECATION_IN_FORMAT =
  `(will be removed in ${DEFAULT_DEPRECATED_VERSION})`;

async function walk(dir: string) {
  for (const x of Deno.readDirSync(dir)) {
    const filePath = `${dir}/${x.name}`;

    if (x.isDirectory) {
      await walk(filePath);
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

    // deno_doc only takes urls.
    const url = new URL(filePath, "file://");
    const docs = await doc(url.href);

    for (const d of docs) {
      const tags = d.jsDoc?.tags;
      if (tags) {
        for (const tag of tags) {
          switch (tag.kind) {
            case "deprecated": {
              const message = tag.doc;
              if (!message) {
                console.error(
                  colors.red("Error"),
                  `${
                    colors.bold("@deprecated")
                  } tag must have a version: ${filePath}:${d.location.line}`,
                );
                shouldFail = true;
                if (FAIL_FAST) Deno.exit(1);
                continue;
              }
              const { version: afterVersion } =
                DEPRECATION_AFTER_FORMAT_REGEX.exec(message)?.groups || {};

              if (afterVersion) {
                if (semver.lt(afterVersion, VERSION)) {
                  console.warn(
                    colors.yellow("Warn"),
                    `${
                      colors.bold("@deprecated")
                    } tag is expired and export should be removed: ${filePath}:${d.location.line}`,
                  );
                }
                continue;
              }

              const { version: inVersion } =
                DEPRECATION_IN_FORMAT_REGEX.exec(message)?.groups || {};
              if (!inVersion) {
                console.error(
                  colors.red("Error"),
                  `${
                    colors.bold("@deprecated")
                  } tag version is missing. Append '${DEPRECATION_IN_FORMAT}' after @deprecated tag: ${filePath}:${d.location.line}`,
                );
                shouldFail = true;
                if (FAIL_FAST) Deno.exit(1);
                continue;
              }

              if (!semver.gt(inVersion, VERSION)) {
                console.error(
                  colors.red("Error"),
                  `${
                    colors.bold("@deprecated")
                  } tag is expired and export must be removed: ${filePath}:${d.location.line}`,
                );
                if (FAIL_FAST) Deno.exit(1);
                shouldFail = true;
                continue;
              }
            }
          }
        }
      }
    }
  }
}

await walk(ROOT);
if (shouldFail) Deno.exit(1);
