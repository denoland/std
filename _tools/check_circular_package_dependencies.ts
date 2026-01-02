// deno-lint-ignore-file no-console
// Copyright 2018-2026 the Deno authors. MIT license.
import {
  createGraph,
  type ModuleGraphJson,
  type ModuleJson,
} from "@deno/graph";
import { getPackagesDenoJsons, resolve } from "./utils.ts";
import graphviz from "graphviz";
import { parse } from "../semver/parse.ts";

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

type DepState = "Stable" | "Unstable";
type Dep = {
  name: string;
  set: Set<string>;
  state: DepState;
};

const packagesDenoJsons = await getPackagesDenoJsons();
const ENTRYPOINTS = Object.fromEntries(packagesDenoJsons.map((pkg) => {
  const entrypoints = Object.values(pkg.exports);
  return [pkg.name.replace("@std/", "").replace("-", "_"), entrypoints];
})) as Record<string, string[]>;

const root = new URL("../", import.meta.url).href;
const deps: Record<string, Dep> = {};

function getPackageNameFromUrl(url: string): string {
  return url.replace(root, "").split("/")[0]!;
}

async function getStability(pkg: string): Promise<DepState> {
  const config = await import(`../${pkg}/deno.json`, {
    with: { type: "json" },
  });
  const version = parse(config.default.version);
  return version.major > 0 ? "Stable" : "Unstable";
}

async function check(
  pkg: string,
  paths: string[] = ["mod.ts"],
): Promise<Dep> {
  const deps = new Set<string>();
  for (const path of paths) {
    const entrypoint = new URL(`../${pkg}/${path}`, import.meta.url).href;
    const graph = await createGraph(entrypoint, { resolve });

    for (
      const dep of new Set(
        getPackageDepsFromSpecifier(pkg, graph, entrypoint),
      )
    ) {
      deps.add(dep);
    }
  }
  deps.delete(pkg);
  return { name: pkg, set: deps, state: await getStability(pkg) };
}

/** Returns package dependencies */
function getPackageDepsFromSpecifier(
  base: string,
  graph: ModuleGraphJson,
  specifier: string,
  seen: Set<string> = new Set(),
): Set<string> {
  const { dependencies } = graph.modules.find((item: ModuleJson) =>
    item.specifier === specifier
  )!;
  const pkg = getPackageNameFromUrl(specifier);
  const deps = new Set([pkg]);
  seen.add(specifier);
  // Captures only direct dependencies of the base package
  // i.e. Does not capture transitive dependencies
  if (dependencies && pkg === base) {
    for (const { code, type } of dependencies) {
      const specifier = code?.specifier ?? type?.specifier!;
      if (seen.has(specifier)) {
        continue;
      }
      const res = getPackageDepsFromSpecifier(
        base,
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
  deps[mod] = await check(mod, entrypoints);
}

/** Checks circular deps between sub modules */
function checkCircularDeps(
  pkg: string,
  ancestors: string[] = [],
  seen: Set<string> = new Set(),
): string[] | undefined {
  const currentDeps = [...ancestors, pkg];
  if (ancestors.includes(pkg)) {
    return currentDeps;
  }
  const d = deps[pkg];
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
  return '"' + mod.replace(/_/g, "-\\n") + '"';
}

/** Returns node style (in DOT language) for each state */
function stateToNodeStyle(state: DepState) {
  switch (state) {
    case "Stable":
      return "[shape=circle fixedsize=1 height=1 style=filled fillcolor=lightgreen]";
    case "Unstable":
      return "[shape=circle fixedsize=1 height=1]";
  }
}

if (Deno.args.includes("--graph")) {
  const lines = [];
  lines.push("digraph std_deps {");
  for (const mod of Object.keys(deps)) {
    const info = deps[mod]!;
    lines.push(`  ${formatLabel(mod)} ${stateToNodeStyle(info.state)};`);
    for (const dep of info.set) {
      lines.push(`  ${formatLabel(mod)} -> ${formatLabel(dep)};`);
    }
  }
  lines.push("}");
  const graph = lines.join("\n");
  // Compile the graph to SVG using the `dot` layout algorithm
  const svg = await graphviz.graphviz.dot(graph, "svg");
  console.log("Writing dependency graph image to .github/dependency_graph.svg");
  await Deno.writeTextFile(".github/dependency_graph.svg", svg);
} else if (Deno.args.includes("--all-imports")) {
  for (const [mod, entrypoints] of Object.entries(ENTRYPOINTS)) {
    for (const path of entrypoints) {
      if (path === "./mod.ts") {
        console.log(`import "jsr:@std/${mod.replaceAll("_", "-")}";`);
      } else {
        console.log(
          `import "jsr:@std/${mod.replaceAll("_", "-")}/${
            path.slice(2).replace(".ts", "").replaceAll("_", "-")
          }";`,
        );
      }
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
