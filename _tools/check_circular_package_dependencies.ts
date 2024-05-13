// deno-lint-ignore-file camelcase
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import {
  createGraph,
  type ModuleGraphJson,
  type ModuleJson,
} from "@deno/graph";
import { resolveWorkspaceSpecifiers } from "./utils.ts";

/**
 * Checks for circular dependencies in the std packages.
 *
 * Usage: deno run -A _tools/check_circular_package_dependencies.ts
 *
 * `--graph` option outputs graphviz diagram. You can convert the output to
 * a visual graph using tools like https://dreampuf.github.io/GraphvizOnline/
 *
 * $ deno run -A _tools/check_circular_package_dependencies.ts --graph
 *
 * `--table` option outputs a table of packages and their status.
 *
 * $ deno run -A _tools/check_circular_package_dependencies.ts --table
 *
 * `--all-imports` option outputs script to import all packages.
 *
 * $ deno run -A _tools/check_circular_package_dependencies.ts --all-imports
 */

type DepState = "Stable" | "Unstable" | "Deprecated";
type Dep = {
  name: string;
  set: Set<string>;
  state: DepState;
};
type Mod =
  | "archive"
  | "assert"
  | "async"
  | "bytes"
  | "cli"
  | "collections"
  | "crypto"
  | "csv"
  | "data_structures"
  | "datetime"
  | "dotenv"
  | "encoding"
  | "expect"
  | "fmt"
  | "front_matter"
  | "fs"
  | "html"
  | "http"
  | "ini"
  | "internal"
  | "io"
  | "json"
  | "jsonc"
  | "log"
  | "media_types"
  | "msgpack"
  | "net"
  | "path"
  | "regexp"
  | "semver"
  | "streams"
  | "testing"
  | "text"
  | "toml"
  | "ulid"
  | "url"
  | "uuid"
  | "webgpu"
  | "yaml";

const ENTRYPOINTS: Record<Mod, string[]> = {
  archive: ["mod.ts"],
  assert: ["mod.ts"],
  async: ["mod.ts"],
  bytes: ["mod.ts"],
  cli: ["mod.ts"],
  collections: ["mod.ts"],
  crypto: ["mod.ts"],
  csv: ["mod.ts"],
  data_structures: ["mod.ts"],
  datetime: ["mod.ts"],
  dotenv: ["mod.ts"],
  encoding: [
    "ascii85.ts",
    "base32.ts",
    "base58.ts",
    "base64.ts",
    "base64url.ts",
    "hex.ts",
    "varint.ts",
  ],
  expect: ["mod.ts"],
  fmt: ["bytes.ts", "colors.ts", "duration.ts", "printf.ts"],
  front_matter: ["mod.ts"],
  fs: ["mod.ts"],
  html: ["mod.ts"],
  http: ["mod.ts"],
  ini: ["mod.ts"],
  internal: ["mod.ts"],
  io: ["mod.ts"],
  json: ["mod.ts"],
  jsonc: ["mod.ts"],
  log: ["mod.ts"],
  media_types: ["mod.ts"],
  msgpack: ["mod.ts"],
  net: ["mod.ts"],
  path: ["mod.ts"],
  regexp: ["mod.ts"],
  semver: ["mod.ts"],
  streams: ["mod.ts"],
  testing: ["bdd.ts", "mock.ts", "snapshot.ts", "time.ts", "types.ts"],
  text: ["mod.ts"],
  toml: ["mod.ts"],
  ulid: ["mod.ts"],
  url: ["mod.ts"],
  uuid: ["mod.ts"],
  webgpu: ["mod.ts"],
  yaml: ["mod.ts"],
};

const STABILITY: Record<Mod, DepState> = {
  archive: "Unstable",
  assert: "Stable",
  async: "Stable",
  bytes: "Stable",
  cli: "Unstable",
  collections: "Stable",
  crypto: "Stable",
  csv: "Stable",
  data_structures: "Unstable",
  datetime: "Unstable",
  dotenv: "Unstable",
  encoding: "Stable",
  expect: "Unstable",
  fmt: "Stable",
  front_matter: "Stable",
  fs: "Stable",
  html: "Unstable",
  http: "Unstable",
  ini: "Unstable",
  internal: "Unstable",
  io: "Unstable",
  json: "Stable",
  jsonc: "Stable",
  log: "Unstable",
  media_types: "Stable",
  msgpack: "Unstable",
  net: "Unstable",
  path: "Stable",
  regexp: "Unstable",
  semver: "Unstable",
  streams: "Stable",
  testing: "Stable",
  text: "Unstable",
  toml: "Stable",
  ulid: "Unstable",
  url: "Unstable",
  uuid: "Stable",
  webgpu: "Unstable",
  yaml: "Stable",
};

const root = new URL("../", import.meta.url).href;
const deps: Record<string, Dep> = {};

function getPackageNameFromUrl(url: string): string {
  return url.replace(root, "").split("/")[0]!;
}

async function check(
  submod: string,
  state: DepState,
  paths: string[] = ["mod.ts"],
): Promise<Dep> {
  const deps = new Set<string>();
  for (const path of paths) {
    const entrypoint = new URL(`../${submod}/${path}`, import.meta.url).href;
    const graph = await createGraph(entrypoint, {
      resolve: resolveWorkspaceSpecifiers,
    });

    for (
      const dep of new Set(getPackageDepsFromSpecifier(graph, entrypoint))
    ) {
      deps.add(dep);
    }
  }
  deps.delete(submod);
  deps.delete("version.ts");
  return { name: submod, set: deps, state };
}

/** Returns package dependencies */
function getPackageDepsFromSpecifier(
  graph: ModuleGraphJson,
  specifier: string,
  seen: Set<string> = new Set(),
): Set<string> {
  const { dependencies } = graph.modules.find((item: ModuleJson) =>
    item.specifier === specifier
  )!;
  const deps = new Set([getPackageNameFromUrl(specifier)]);
  seen.add(specifier);
  if (dependencies) {
    for (const { code, type } of dependencies) {
      const specifier = code?.specifier ?? type?.specifier!;
      if (seen.has(specifier)) {
        continue;
      }
      const res = getPackageDepsFromSpecifier(
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

for (const [mod, entrypoints] of Object.entries(ENTRYPOINTS)) {
  deps[mod] = await check(mod, STABILITY[mod as Mod], entrypoints);
}

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
    const info = deps[mod]!;
    console.log(`  ${formatLabel(mod)} ${stateToNodeStyle(info.state)};`);
    for (const dep of info.set) {
      console.log(`  ${formatLabel(mod)} -> ${dep};`);
    }
  }
  console.log("}");
} else if (Deno.args.includes("--table")) {
  console.log("| Package         | Status     |");
  console.log("| --------------- | ---------- |");
  for (const [mod, info] of Object.entries(deps)) {
    console.log(`| ${mod.padEnd(15)} | ${info.state.padEnd(10)} |`);
  }
} else if (Deno.args.includes("--all-imports")) {
  for (const [mod, entrypoints] of Object.entries(ENTRYPOINTS)) {
    for (const path of entrypoints) {
      console.log(`import "std/${mod}/${path}";`);
    }
  }
} else {
  console.log(`${Object.keys(deps).length} packages checked.`);
  for (const mod of Object.keys(deps)) {
    const res = checkCircularDeps(mod);
    if (res) {
      console.log(`Circular dependencies found: ${res.join(" -> ")}`);
      Deno.exit(1);
    }
  }
  console.log("No circular dependencies found.");
}
