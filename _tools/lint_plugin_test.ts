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

Deno.test("deno-style-guide/error-message", {
  ignore: !Deno.version.deno.startsWith("2"),
}, () => {
  // Good
  assertLintPluginDiagnostics(
    `
new Error("Cannot parse input");
new Error("Cannot parse input x");
new Error('Cannot parse input "hello, world"');
new Error("Cannot parse input x: value is empty");

// ignored
const classes = { Error: Error }
new classes.Error();
new Class("Cannot parse input");
new Error(message);
new WrongParamTypeForAnError(true);
    `,
    [],
  );

  // Bad
  assertLintPluginDiagnostics(
    `
new Error("cannot parse input");
new TypeError("Cannot parse input.");
new SyntaxError("Invalid input x");
new RangeError("Cannot parse input x. value is empty")
new CustomError("Can't parse input");

    `,
    [
      {
        fix: [{ range: [11, 31], text: '"Cannot parse input"' }],
        hint:
          "Capitalize the error message. See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
        id: "deno-style-guide/error-message",
        message: "Error message starts with a lowercase.",
        range: [11, 31],
      },
      {
        fix: [{ range: [48, 69], text: '"Cannot parse input"' }],
        hint:
          "Remove the period at the end of the error message. See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
        id: "deno-style-guide/error-message",
        message: "Error message ends with a period.",
        range: [48, 69],
      },
      {
        fix: [],
        hint:
          "Remove periods in error message and use a colon for addition information. See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
        id: "deno-style-guide/error-message",
        message: "Error message contains periods.",
        range: [123, 161],
      },
      {
        fix: [],
        hint:
          "Use the full form in error message. See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
        id: "deno-style-guide/error-message",
        message: "Error message uses contractions.",
        range: [179, 198],
      },
    ],
  );
});
