// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { VERSION } from "../version.ts";
import * as semver from "../semver/mod.ts";
import * as colors from "../fmt/colors.ts";
import { doc } from "https://deno.land/x/deno_doc@0.48.0/mod.ts";
import { walk } from "../fs/walk.ts";

const EXTENSIONS = [".mjs", ".js", ".ts"];
const EXCLUDED_PATHS = [
  ".git",
  "node",
  "dotenv/testdata",
  "fs/testdata",
  "http/testdata",
  "http/_negotiation",
  "crypto/_wasm",
  "crypto/_fnv",
  "encoding/varint/_wasm",
  "encoding/_yaml",
  "encoing/_toml",
  "_tools",
  "_util",
];

console.warn(
  colors.yellow("Warning"),
  `ignore ${
    colors.green(`"fs/exists.ts"`)
  } until issue is resolved: https://github.com/denoland/deno_std/issues/2594`,
);
EXCLUDED_PATHS.push("fs/exists.ts");

const ROOT = new URL("../", import.meta.url);

const FAIL_FAST = Deno.args.includes("--fail-fast");

const DEPRECATION_IN_FORMAT_REGEX =
  /^\(will be removed in (?<version>\d+\.\d+\.\d+)\)/;
const DEPRECATION_AFTER_FORMAT_REGEX =
  /^\(will be removed after (?<version>\d+\.\d+\.\d+)\)/;

let shouldFail = false;

// add three minor version to current version
const DEFAULT_DEPRECATED_VERSION = semver.increment(
  semver.increment(
    semver.increment(
      VERSION,
      "minor",
    )!,
    "minor",
  )!,
  "minor",
);

const DEPRECATION_IN_FORMAT =
  `(will be removed in ${DEFAULT_DEPRECATED_VERSION})`;

for await (
  const { path } of walk(ROOT, {
    includeDirs: false,
    exts: EXTENSIONS,
    skip: EXCLUDED_PATHS.map((path) => new RegExp(path + "$")),
  })
) {
  // deno_doc only takes urls.
  const url = new URL(path, "file://");
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
                } tag must have a version: ${path}:${d.location.line}`,
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
                  } tag is expired and export should be removed: ${path}:${d.location.line}`,
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
                } tag version is missing. Append '${DEPRECATION_IN_FORMAT}' after @deprecated tag: ${path}:${d.location.line}`,
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
                } tag is expired and export must be removed: ${path}:${d.location.line}`,
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

if (shouldFail) Deno.exit(1);
