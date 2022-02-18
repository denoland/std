#!/usr/bin/env -S deno run --allow-read --allow-net=deno.land
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import * as denoGraph from "https://deno.land/x/deno_graph@0.18.0/mod.ts";
const root = `${new URL("../node/module_all.ts", import.meta.url)}`;
const seen = new Set<string>();
/** Returns the circular dependency from the given module graph and
 * specifier if exists, returns undefined otherwise. */
function getCircularDeps(
  graph: denoGraph.ModuleGraph,
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
  for (const { code, type } of graph.get(specifier)!.toJSON().dependencies!) {
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
  seen.add(specifier);
}
const circularDeps = getCircularDeps(await denoGraph.createGraph(root), root);
if (circularDeps) {
  console.log("Found circular dependencies", circularDeps);
  Deno.exit(1);
}
console.log("No circular dependencies");
