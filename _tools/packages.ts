// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { walk } from "../fs/walk.ts";
import { relative } from "../path/mod.ts";

export async function discoverPackages() {
  const packages = [];
  for await (const entry of Deno.readDir(".")) {
    if (
      entry.isDirectory && !entry.name.startsWith(".") &&
      !entry.name.startsWith("_") && entry.name !== "coverage"
    ) {
      packages.push(entry.name);
    }
  }
  packages.sort();

  console.log("Discovered", packages.length, "packages.");
  return packages;
}

export async function discoverExportsByPackage(packages: string[]) {
  // Collect all of the exports for each package.
  const exportsByPackage = new Map<string, [string, string][]>();
  for (const pkg of packages) {
    const exports = await discoverExports(pkg);
    exportsByPackage.set(pkg, exports);
  }
  return exportsByPackage;
}

async function discoverExports(pkg: string) {
  const exports: [string, string][] = [];
  const base = await Deno.realPath(pkg);
  const files = walk(base, {
    includeFiles: true,
    includeDirs: false,
    includeSymlinks: false,
  });
  for await (const file of files) {
    const path = "/" + relative(base, file.path).replaceAll("\\", "/");
    const name = path.replace(/(\.d)?\.ts$/, "");
    if (name === path && !name.endsWith(".json")) continue; // not a typescript
    if (name.includes("/.") || name.includes("/_")) continue; // hidden/internal files
    if (
      (name.endsWith("_test") || name.endsWith("/test")) &&
      !(name === "/test" && pkg === "front_matter")
    ) continue; // test files
    if (name.includes("/example/") || name.endsWith("_example")) continue; // example files
    if (name.includes("/testdata/")) continue; // testdata files
    if (name.endsWith("/deno.json")) continue; // deno.json files

    const key = "." + name.replace(/\/mod$/, "").replaceAll("_", "-");
    exports.push([key, "." + path]);
  }
  exports.sort((a, b) => a[0].localeCompare(b[0]));
  return exports;
}

if (import.meta.main) {
  const packages = await discoverPackages();
  console.log(packages);
}
