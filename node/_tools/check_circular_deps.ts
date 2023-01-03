// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  createGraph,
  ModuleGraph,
} from "https://deno.land/x/deno_graph@0.40.0/mod.ts";

const root = `${new URL("../module_all.ts", import.meta.url)}`;
const seen = new Set<string>();
/** Returns the circular dependency from the given module graph and
 * specifier if exists, returns undefined otherwise. */
function getCircularDeps(
  graph: ModuleGraph,
  specifier: string,
  ancestors: string[] = [],
): string[] | undefined {
  if (seen.has(specifier)) {
    // It's already checked.
    return undefined;
  }
  if (ancestors.includes(specifier)) {
    return [...ancestors, specifier];
  }
  const { dependencies } = graph.get(specifier)!.toJSON();
  if (dependencies) {
    for (const { code, type } of dependencies) {
      const circularDeps = getCircularDeps(
        graph,
        code?.specifier ?? type?.specifier!,
        [
          ...ancestors,
          specifier,
        ],
      );
      if (circularDeps) {
        return circularDeps;
      }
    }
  }
  seen.add(specifier);
}
const circularDeps = getCircularDeps(await createGraph(root), root);
if (circularDeps) {
  console.log("Found circular dependencies", circularDeps);
  Deno.exit(1);
}
console.log("No circular dependencies");
