// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  createGraph,
  ModuleGraphJson,
  ModuleJson,
} from "https://deno.land/x/deno_graph@0.52.0/mod.ts";

/**
 * Checks for circular dependencies in the std submodules.
 *
 * When run with `--graph` it will output a graphviz graph in dot language.
 */

const root = new URL("../", import.meta.url).href;
const deps: Record<string, Set<string>> = {};

function getSubmoduleName(url: string) {
  return url.replace(root, "").split("/")[0];
}

async function check(submod: string, paths: string[] = ["mod.ts"]) {
  const deps = new Set<string>();
  for (const path of paths) {
    const entrypoint = new URL(`../${submod}/${path}`, import.meta.url).href;
    const graph = await createGraph(entrypoint);

    for (const dep of new Set(getDeps(graph, entrypoint))) {
      deps.add(dep);
    }
  }
  deps.delete(submod);
  deps.delete("types.d.ts");
  return deps;
}

/** Returns submodule dependencies */
function getDeps(
  graph: ModuleGraphJson,
  specifier: string,
  seen: Set<string> = new Set(),
): Set<string> {
  const { dependencies } = graph.modules.find((item: ModuleJson) =>
    item.specifier === specifier
  )!;
  const deps = new Set([getSubmoduleName(specifier)]);
  seen.add(specifier);
  if (dependencies) {
    for (const { code, type } of dependencies) {
      const specifier = code?.specifier ?? type?.specifier!;
      if (seen.has(specifier)) {
        continue;
      }
      const res = getDeps(
        graph,
        specifier,
        seen,
      )!;
      for (const dep of res) {
        deps.add(dep);
      }
    }
  }
  return deps;
}

deps["archive"] = await check("archive");
deps["assert"] = await check("assert");
deps["async"] = await check("async");
deps["bytes"] = await check("bytes");
deps["collections"] = await check("collections");
deps["console"] = await check("console");
deps["crypto"] = await check("crypto");
deps["csv"] = await check("csv");
deps["datetime"] = await check("datetime");
deps["dotenv"] = await check("dotenv");
deps["encoding"] = await check("encoding", [
  "ascii85.ts",
  "base32.ts",
  "base58.ts",
  "base64.ts",
  "base64url.ts",
  "binary.ts",
  "hex.ts",
  "varint.ts",
]);
deps["flags"] = await check("flags");
deps["fmt"] = await check("fmt", [
  "bytes.ts",
  "colors.ts",
  "duration.ts",
  "printf.ts",
]);
deps["front_matter"] = await check("front_matter");
deps["fs"] = await check("fs");
deps["html"] = await check("html");
deps["http"] = await check("http");
deps["io"] = await check("io");
deps["json"] = await check("json");
deps["jsonc"] = await check("jsonc");
deps["log"] = await check("log");
deps["media_types"] = await check("media_types");
deps["msgpack"] = await check("msgpack");
deps["path"] = await check("path");
deps["permissions"] = await check("permissions");
deps["regexp"] = await check("regexp");
deps["semver"] = await check("semver");
deps["signal"] = await check("signal");
deps["streams"] = await check("streams");
deps["testing"] = await check("testing", [
  "bdd.ts",
  "mock.ts",
  "snapshot.ts",
  "time.ts",
  "types.ts",
]);
deps["toml"] = await check("toml");
deps["uuid"] = await check("uuid");
deps["wasi"] = await check("wasi", ["snapshot_preview1.ts"]);
deps["yaml"] = await check("yaml");

function checkCircularDeps(
  submod: string,
  ancestors: string[] = [],
  seen: Set<string> = new Set(),
): string[] | undefined {
  const currentDeps = [...ancestors, submod];
  if (ancestors.includes(submod)) {
    return currentDeps;
  }
  const d = deps[submod];
  if (!d) {
    return;
  }
  for (const mod of d) {
    const res = checkCircularDeps(mod, currentDeps, seen);
    if (res) {
      return res;
    }
  }
}

if (Deno.args.includes("--graph")) {
  console.log("digraph std_deps {");
  for (const mod of Object.keys(deps)) {
    console.log(`  ${mod};`);
    for (const dep of deps[mod]) {
      console.log(`  ${mod} -> ${dep};`);
    }
  }
  console.log("}");
} else {
  console.log(`${Object.keys(deps).length} submodules checked.`);
  for (const mod of Object.keys(deps)) {
    const res = checkCircularDeps(mod);
    if (res) {
      console.log(`Circular dependencies found: ${res.join(" -> ")}`);
      Deno.exit(1);
    }
  }
  console.log("No circular dependencies found.");
}
