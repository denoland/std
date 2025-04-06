// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert/equals";
import lintPlugin from "./error_message_lint_plugin.ts";

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
          "See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
        id: "deno-style-guide/error-message",
        message: "Error message should start with an uppercase.",
        range: [11, 31],
      },
      {
        fix: [{ range: [48, 69], text: '"Cannot parse input"' }],
        hint:
          "See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
        id: "deno-style-guide/error-message",
        message: "Error message should not end with a period.",
        range: [48, 69],
      },
      {
        fix: [],
        hint:
          "See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
        id: "deno-style-guide/error-message",
        message: "Error message should not contain periods.",
        range: [123, 161],
      },
      {
        fix: [],
        hint:
          "See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
        id: "deno-style-guide/error-message",
        message: "Error message should not use contractions.",
        range: [179, 198],
      },
    ],
  );
});
