import * as esbuild from "https://deno.land/x/esbuild@v0.16.17/mod.js";

const PROJECT_ROOT = new URL("..", import.meta.url).pathname;
const BUNDLE_FILENAME = "node_bundle.js";

await esbuild.build({
  entryPoints: ["./node/module_all.ts"],
  outfile: BUNDLE_FILENAME,
  bundle: true,
  format: "iife",
  legalComments: "none",
});

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