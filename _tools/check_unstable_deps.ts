// Copyright 2018-2026 the Deno authors. MIT license.
// deno-lint-ignore-file no-console

/**
 * This script checks if the stable modules import the unstable modules.
 *
 * Usage: `deno run -A _tools/check_unstable_deps.ts`
 *
 * @module
 */
import { getEntrypoints, getPackagesDenoJsons, resolve } from "./utils.ts";
import { partition } from "@std/collections/partition";
import { createGraph } from "@deno/graph";

// These 2 paths are known to include unstable module (net/unstable_get_network_address.ts)
// and should be ignored.
const EXCEPTIONS = [
  "@std/http/file-server",
  "@std/http",
];

const entrypoints = await getEntrypoints();
const unstablePackageNames = (await getPackagesDenoJsons())
  .filter(({ version }) => version.startsWith("0."))
  .map(({ name }) => name);

const [unstableEntrypoints, stableEntrypoints] = partition(
  entrypoints,
  (entrypoint) =>
    unstablePackageNames.some((name) => entrypoint.startsWith(name)) ||
    entrypoint.includes("unstable-"),
);

const unstableSpecifiers = unstableEntrypoints
  .map((entrypoint) => import.meta.resolve(entrypoint));
const stableSpecifiers = stableEntrypoints
  .filter((entrypoint) => !EXCEPTIONS.includes(entrypoint))
  .map((entrypoint) => import.meta.resolve(entrypoint));

let hasError = false;
const graph = await createGraph(stableSpecifiers, { resolve });
for (const module of graph.modules) {
  if (module.dependencies === undefined) continue;
  for (const dependency of module.dependencies) {
    if (dependency.code === undefined) continue;
    const { specifier } = dependency.code;
    if (!specifier || !unstableSpecifiers.includes(specifier)) continue;
    console.error(
      `Stable module ${module.specifier} imports unstable module: ${specifier}`,
    );
    hasError = true;
  }
}

if (hasError) {
  Deno.exit(1);
}
console.log("No unstable module is used in stable modules.");
