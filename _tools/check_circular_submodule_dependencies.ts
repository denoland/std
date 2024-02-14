// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { createGraph, ModuleGraphJson, ModuleJson } from "deno_graph";

/**
 * Checks for circular dependencies in the std submodules.
 *
 * Usage: deno run -A _tools/check_circular_submodule_dependencies.ts
 *
 * `--graph` option outputs graphviz diagram. You can convert the output to
 * a visual graph using tools like https://dreampuf.github.io/GraphvizOnline/
 *
 * $ deno run -A _tools/check_circular_submodule_dependencies.ts --graph
 *
 * `--table` option outputs a table of submodules and their status.
 *
 * $ deno run -A _tools/check_circular_submodule_dependencies.ts --table
 */

type DepState = "Stable" | "Unstable" | "Deprecated";
type Dep = {
  name: string;
  set: Set<string>;
  state: DepState;
};

const root = new URL("../", import.meta.url).href;
const deps: Record<string, Dep> = {};

function getSubmoduleNameFromUrl(url: string) {
  return url.replace(root, "").split("/")[0];
}

async function check(
  submod: string,
  state: DepState,
  paths: string[] = ["mod.ts"],
): Promise<Dep> {
  const deps = new Set<string>();
  for (const path of paths) {
    const entrypoint = new URL(`../${submod}/${path}`, import.meta.url).href;
    const graph = await createGraph(entrypoint);

    for (
      const dep of new Set(getSubmoduleDepsFromSpecifier(graph, entrypoint))
    ) {
      deps.add(dep);
    }
  }
  deps.delete(submod);
  return { name: submod, set: deps, state };
}

/** Returns submodule dependencies */
function getSubmoduleDepsFromSpecifier(
  graph: ModuleGraphJson,
  specifier: string,
  seen: Set<string> = new Set(),
): Set<string> {
  const { dependencies } = graph.modules.find((item: ModuleJson) =>
    item.specifier === specifier
  )!;
  const deps = new Set([getSubmoduleNameFromUrl(specifier)]);
  seen.add(specifier);
  if (dependencies) {
    for (const { code, type } of dependencies) {
      const specifier = code?.specifier ?? type?.specifier!;
      if (seen.has(specifier)) {
        continue;
      }
      const res = getSubmoduleDepsFromSpecifier(
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

deps["archive"] = await check("archive", "Unstable");
deps["assert"] = await check("assert", "Stable");
deps["async"] = await check("async", "Stable");
deps["bytes"] = await check("bytes", "Stable");
deps["cli"] = await check("collections", "Unstable");
deps["collections"] = await check("collections", "Stable");
deps["console"] = await check("console", "Unstable");
deps["crypto"] = await check("crypto", "Stable");
deps["csv"] = await check("csv", "Stable");
deps["data_structures"] = await check("data_structures", "Unstable");
deps["datetime"] = await check("datetime", "Unstable");
deps["dotenv"] = await check("dotenv", "Unstable");
deps["encoding"] = await check("encoding", "Stable", [
  "ascii85.ts",
  "base32.ts",
  "base58.ts",
  "base64.ts",
  "base64url.ts",
  "binary.ts",
  "hex.ts",
  "varint.ts",
]);
deps["expect"] = await check("expect", "Unstable");
deps["flags"] = await check("flags", "Unstable");
deps["fmt"] = await check("fmt", "Stable", [
  "bytes.ts",
  "colors.ts",
  "duration.ts",
  "printf.ts",
]);
deps["front_matter"] = await check("front_matter", "Stable");
deps["fs"] = await check("fs", "Stable");
deps["html"] = await check("html", "Unstable");
deps["http"] = await check("http", "Unstable");
deps["ini"] = await check("ini", "Unstable");
deps["io"] = await check("io", "Unstable");
deps["json"] = await check("json", "Stable");
deps["jsonc"] = await check("jsonc", "Stable");
deps["log"] = await check("log", "Unstable");
deps["media_types"] = await check("media_types", "Stable");
deps["msgpack"] = await check("msgpack", "Unstable");
deps["net"] = await check("net", "Unstable");
deps["path"] = await check("path", "Stable");
deps["permissions"] = await check("permissions", "Deprecated");
deps["regexp"] = await check("regexp", "Unstable");
deps["semver"] = await check("semver", "Unstable");
deps["streams"] = await check("streams", "Stable");
deps["testing"] = await check("testing", "Stable", [
  "bdd.ts",
  "mock.ts",
  "snapshot.ts",
  "time.ts",
  "types.ts",
]);
deps["text"] = await check("text", "Unstable");
deps["toml"] = await check("toml", "Stable");
deps["ulid"] = await check("ulid", "Unstable");
deps["url"] = await check("url", "Unstable");
deps["uuid"] = await check("uuid", "Stable");
deps["webgpu"] = await check("webgpu", "Unstable");
deps["yaml"] = await check("yaml", "Stable");

/** Checks circular deps between sub modules */
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
  for (const mod of d.set) {
    const res = checkCircularDeps(mod, currentDeps, seen);
    if (res) {
      return res;
    }
  }
}

/** Formats label for diagram */
function formatLabel(mod: string) {
  return '"' + mod.replace(/_/g, "_\\n") + '"';
}

/** Returns node style (in DOT language) for each state */
function stateToNodeStyle(state: DepState) {
  switch (state) {
    case "Stable":
      return "[shape=doublecircle fixedsize=1 height=1.1]";
    case "Unstable":
      return "[shape=box style=filled, fillcolor=pink]";
    case "Deprecated":
      return "[shape=box style=filled, fillcolor=gray]";
  }
}

if (Deno.args.includes("--graph")) {
  console.log("digraph std_deps {");
  for (const mod of Object.keys(deps)) {
    const info = deps[mod];
    console.log(`  ${formatLabel(mod)} ${stateToNodeStyle(info.state)};`);
    for (const dep of deps[mod].set) {
      console.log(`  ${formatLabel(mod)} -> ${dep};`);
    }
  }
  console.log("}");
} else if (Deno.args.includes("--table")) {
  console.log("| Sub-module      | Status     |");
  console.log("| --------------- | ---------- |");
  for (const [mod, info] of Object.entries(deps)) {
    console.log(`| ${mod.padEnd(15)} | ${info.state.padEnd(10)} |`);
  }
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
