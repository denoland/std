// deno-lint-ignore-file no-console
// Copyright 2018-2026 the Deno authors. MIT license.

import importMap from "../import_map.json" with { type: "json" };
import { getPackagesDenoJsons } from "./utils.ts";

// deno-lint-ignore no-explicit-any
const imports = importMap.imports as any;

let failed = false;

for (const denoJson of await getPackagesDenoJsons()) {
  const dependency = imports[denoJson.name];

  if (!dependency) {
    console.warn(`No import map entry found for ${denoJson.name}`);
    failed = true;
    continue;
  }
  const correctDependency = `jsr:${denoJson.name}@^${denoJson.version}`;
  if (dependency !== correctDependency) {
    console.warn(
      `Invalid import map entry for ${denoJson.name}: ${dependency}`,
    );
    console.warn(
      `Expected: ${correctDependency}`,
    );
    failed = true;
  }
}

if (failed) {
  Deno.exit(1);
}

console.log("ok");
