// Copyright 2018-2025 the Deno authors. MIT license.
// deno-lint-ignore-file no-console

/**
 * This script checks if the stable modules import the unstable modules.
 *
 * Usage: `deno run -A _tools/check_unstable_deps.ts`
 *
 * @module
 */

// These 2 paths are known to include unstable module (net/unstable_get_network_address.ts)
// and should be ignored.
const EXCEPTIONS = [
  "std/http/file_server.ts",
  "std/http/mod.ts",
];

import denoJson from "../deno.json" with { type: "json" };
import { join } from "@std/path/unstable-join";
import { greaterOrEqual, parse } from "@std/semver";
import { zip } from "@std/collections/zip";
import { resolveWorkspaceSpecifiers } from "./utils.ts";
import { createGraph } from "@deno/graph";

type DenoJson = { version: string; exports: Record<string, string> };
function readDenoJson(path: string): Promise<DenoJson> {
  return Deno.readTextFile(join(path, "deno.json")).then(JSON.parse);
}
const semver1 = parse("1.0.0");
function isStable(version: string) {
  return greaterOrEqual(parse(version), semver1);
}

const { workspace } = denoJson;
const packages = zip(workspace, await Promise.all(workspace.map(readDenoJson)));
const stablePackages = packages.filter(([_, { version }]) => isStable(version));
const unstablePackagePaths = packages
  .filter(([_, { version }]) => !isStable(version))
  .map(([path]) => join("std", path));
const stableEntrypoints = stablePackages.flatMap(([dir, { exports }]) =>
  Object.values(exports)
    .filter((path) => !path.includes("unstable_"))
    .map((path) => new URL(`../${dir}/${path}`, import.meta.url).href)
);

function isUnstableModule(specifier: string) {
  return unstablePackagePaths.some((path) => specifier.includes(path)) ||
    specifier.includes("unstable_");
}

let hasError = false;
for (const path of stableEntrypoints) {
  if (EXCEPTIONS.some((exception) => path.endsWith(exception))) {
    console.log(`Skip checking ${path}`);
    continue;
  }
  const graph = await createGraph(path, {
    resolve: resolveWorkspaceSpecifiers,
  });
  const dependencySpecifiers = graph.modules.map((m) => m.specifier);
  const unstableDependencies = dependencySpecifiers.filter(isUnstableModule);
  if (unstableDependencies.length > 0) {
    console.error(
      `Stable module ${path} imports unstable modules:`,
      unstableDependencies,
    );
    hasError = true;
  }
}
if (hasError) {
  Deno.exit(1);
}
console.log("No unstable module is used in stable modules.");
