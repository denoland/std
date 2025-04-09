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

Deno.test("deno-style-guide/no-external-code", {
  ignore: !Deno.version.deno.startsWith("2"),
}, () => {
  // Good
  assertLintPluginDiagnostics('import { walk } from "@std/fs/walk";', []);

  // Bad
  assertLintPluginDiagnostics(
    `
import { bad } from "https://deno.land/malicious-muffin/bad.ts";
import { bad } from "jsr:@malicious-muffin/bad";
import { bad } from "@malicious-muffin/bad";
    `,
    [{
      id: "deno-style-guide/no-external-code",
      fix: [],
      range: [1, 65],
      message: "External imports are not allowed",
      hint:
        'Use code from within `@std` instead of external code, if possible. E.g. Use `import { foo } from "@std/foo"` instead of `import { foo } from "https://deno.land/std@0.177.0/foo.ts"`.',
    }, {
      id: "deno-style-guide/no-external-code",
      fix: [],
      range: [66, 114],
      message: "External imports are not allowed",
      hint:
        'Use code from within `@std` instead of external code, if possible. E.g. Use `import { foo } from "@std/foo"` instead of `import { foo } from "https://deno.land/std@0.177.0/foo.ts"`.',
    }, {
      id: "deno-style-guide/no-external-code",
      fix: [],
      range: [115, 159],
      message: "External imports are not allowed",
      hint:
        'Use code from within `@std` instead of external code, if possible. E.g. Use `import { foo } from "@std/foo"` instead of `import { foo } from "https://deno.land/std@0.177.0/foo.ts"`.',
    }],
  );
});
