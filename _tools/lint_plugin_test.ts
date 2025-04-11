// Copyright 2018-2025 the Deno authors. MIT license.
// @ts-nocheck Deno.lint namespace does not pass type checking in Deno 1.x

import { assertEquals } from "@std/assert/equals";
import lintPlugin from "./lint_plugin.ts";

function assertLintPluginDiagnostics(
  source: string,
  // Note: if empty, means no lint errors
  expectedDiagnostics: Deno.lint.Diagnostic[],
) {
  const actualDiagnostics = Deno.lint.runPlugin(
    lintPlugin,
    "main.ts", // Dummy filename, file doesn't need to exist.
    source,
  );
  assertEquals(actualDiagnostics, expectedDiagnostics);
}

Deno.test("deno-style-guide/prefer-private-field", {
  ignore: !Deno.version.deno.startsWith("2"),
}, () => {
  // Good
  assertLintPluginDiagnostics(
    `
class MyClass {
  #foo = 1;
  #bar() {}
}
    `,
    [],
  );

  // Bad
  assertLintPluginDiagnostics(
    `
class MyClass {
  private foo = 1;
  private bar() {}
}`,
    [{
      id: "deno-style-guide/prefer-private-field",
      fix: [],
      range: [19, 35],
      message: "Property uses `private` keyword",
      hint:
        "Use private field (`#`) instead of the `private` keyword. E.g. Use `#foo` instead of `private foo`.",
    }, {
      id: "deno-style-guide/prefer-private-field",
      range: [38, 54],
      fix: [],
      message: "Method uses `private` keyword",
      hint:
        "Use private field (`#`) instead of the `private` keyword. E.g. Use `#foo()` instead of `private foo()`.",
    }],
  );
});
