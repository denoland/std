// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import * as esbuild from "https://deno.land/x/esbuild@v0.16.17/mod.js";

const PROJECT_ROOT = new URL("..", import.meta.url).pathname;
const BUNDLE_FILENAME = "node_bundle.js";

const result = await esbuild.build({
  entryPoints: ["./node/module_all.ts"],
  outfile: BUNDLE_FILENAME,
  bundle: true,
  format: "iife",
  legalComments: "none",
});

if (result.warnings.length > 0) {
  console.warn("Bundle generated with warnings:");
  for (const warning of result.warnings) {
    console.warn(warning);
  }
}
if (result.errors.length > 0) {
  console.warn("Generating bundle failed:");
  for (const error of result.errors) {
    console.warn(error);
  }
  Deno.exit(1);
}
const source = await Deno.readTextFile(`${PROJECT_ROOT}${BUNDLE_FILENAME}`);
const sourceLines = source.split("\n");

sourceLines.splice(
  0,
  1,
  `((window) => {
  function initNodePolyfill() {`,
);
sourceLines.pop();
sourceLines.pop();
sourceLines.push(
  `    Deno[Deno.internal].nodePolyfills = module_all_default;
    return module_all_default;
  }

  window.__bootstrap.internals = {
    ...window.__bootstrap.internals ?? {},
    initNodePolyfill: initNodePolyfill,
    };
})(globalThis);`,
);

await Deno.writeTextFile(
  `${PROJECT_ROOT}${BUNDLE_FILENAME}`,
  sourceLines.join("\n"),
);
console.log(
  "Bundle generated successfully at",
  `${PROJECT_ROOT}${BUNDLE_FILENAME}`,
);
Deno.exit(0);
