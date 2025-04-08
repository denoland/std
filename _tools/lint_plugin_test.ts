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

Deno.test("deno-style-guide/exported-function-args-maximum", {
  ignore: !Deno.version.deno.startsWith("2"),
}, () => {
  // Good
  assertLintPluginDiagnostics(
    `
function foo() {
}
function foo(bar: unknown) {
}
function foo(bar: unknown, baz: unknown) {
}
function foo(bar: unknown, baz: unknown, options: Record<string, unknown>) {
}
function foo(bar: unknown, baz: unknown, bat: unknown, bay: unknown) {
}
export function foo() {
}
export function foo(bar: unknown) {
}
export function foo(bar: unknown, baz: unknown) {
}
export function foo(bar: unknown, baz: unknown, options: Record<string, unknown>) {
}
    `,
    [],
  );

  // Bad
  assertLintPluginDiagnostics(
    `
export function foo(bar: unknown, baz: unknown, bat: unknown) {
}
export function foo(bar: unknown, baz: unknown, bat: unknown, options: Record<string, unknown>) {
}
`,
    [
      {
        fix: [],
        hint:
          "Export functions can have 0-2 required arguments, plus (if necessary) an options object (so max 3 total).",
        id: "deno-style-guide/exported-function-args-maximum",
        message: "Third argument of export function is not an options object.",
        range: [17, 20],
      },
      {
        fix: [],
        hint:
          "Export functions can have 0-2 required arguments, plus (if necessary) an options object (so max 3 total).",
        id: "deno-style-guide/exported-function-args-maximum",
        message: "Exported function has more than three arguments.",
        range: [83, 86],
      },
    ],
  );
});
