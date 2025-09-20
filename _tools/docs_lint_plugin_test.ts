// Copyright 2018-2025 the Deno authors. MIT license.

import docsLintPlugin from "./docs_lint_plugin.ts";
import { assertEquals } from "@std/assert/equals";

Deno.test("deno-std-docs/exported-symbol-documented", {
  ignore: !Deno.version.deno.startsWith("2"),
}, () => {
  // Good
  const diagnostics1 = Deno.lint.runPlugin(
    docsLintPlugin,
    "module.ts",
    `/** This is a documented symbol */
    export function documented() {} `,
  );
  assertEquals(diagnostics1, []);

  // Good (internal file)
  const diagnostics2 = Deno.lint.runPlugin(
    docsLintPlugin,
    "_module.ts",
    `export function undocumented() {}`,
  );
  assertEquals(diagnostics2, []);

  // Good (file within internal folder)
  const diagnostics3 = Deno.lint.runPlugin(
    docsLintPlugin,
    "_internal/module.ts",
    `export function undocumented() {}`,
  );
  assertEquals(diagnostics3, []);

  // Bad
  const diagnostics4 = Deno.lint.runPlugin(
    docsLintPlugin,
    "module.ts",
    `export function undocumented() {}`,
  );
  assertEquals(diagnostics4, [
    {
      id: "deno-std-docs/exported-symbol-documented",
      message: "Exported symbol is missing a documentation comment.",
      range: [0, 33],
      fix: [],
      hint: "Add a documentation comment above the symbol.",
    },
  ]);
});
