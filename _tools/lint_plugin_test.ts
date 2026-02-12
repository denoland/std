// Copyright 2018-2026 the Deno authors. MIT license.
// Deno.lint namespace does not pass type checking in Deno 1.x

import { assertEquals } from "@std/assert/equals";
import lintPlugin, { COPYRIGHT_NOTICE } from "./lint_plugin.ts";

function assertLintPluginDiagnostics(
  source: string,
  // Note: if empty, means no lint errors
  expectedDiagnostics: Deno.lint.Diagnostic[],
  // Set to false when wanting to check comments (i.e. testing of `deno-style-guide/copyright-notice` lint rule)
  ignoreComments = true,
) {
  const actualDiagnostics = Deno.lint.runPlugin(
    lintPlugin,
    ignoreComments ? "ignore_comments.ts" : "main.ts", // Dummy filename, file doesn't need to exist.
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

Deno.test("deno-style-guide/no-top-level-arrow-syntax", {
  ignore: !Deno.version.deno.startsWith("2"),
}, () => {
  // Bad
  assertLintPluginDiagnostics(
    `
const foo = () => "bar";
export const bar = () => "foo";
    `,
    [
      {
        id: "deno-style-guide/no-top-level-arrow-syntax",
        range: [13, 24],
        fix: [],
        message: "Top-level functions should not use arrow syntax",
        hint:
          "Use function declaration instead of arrow function. E.g. Use `function foo() {}` instead of `const foo = () => {}`.",
      },
      {
        id: "deno-style-guide/no-top-level-arrow-syntax",
        range: [45, 56],
        fix: [],
        message: "Top-level functions should not use arrow syntax",
        hint:
          "Use function declaration instead of arrow function. E.g. Use `function foo() {}` instead of `const foo = () => {}`.",
      },
    ],
  );

  // Good
  assertLintPluginDiagnostics(
    `
function foo() {
  const bar = () => "baz";

  return "bar";
}`,
    [],
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
    `,
    [{
      id: "deno-style-guide/no-external-code",
      fix: [],
      range: [1, 65],
      message: "External imports are not allowed outside of tools",
      hint:
        'Use code from within `@std` instead of external code. E.g. Use `import { foo } from "@std/foo"` instead of `import { foo } from "https://deno.land/x/foo/mod.ts"`.',
    }, {
      id: "deno-style-guide/no-external-code",
      fix: [],
      range: [66, 114],
      message: "External imports are not allowed outside of tools",
      hint:
        'Use code from within `@std` instead of external code. E.g. Use `import { foo } from "@std/foo"` instead of `import { foo } from "https://deno.land/x/foo/mod.ts"`.',
    }],
  );
});

Deno.test("deno-style-guide/naming-convention", {
  ignore: !Deno.version.deno.startsWith("2"),
}, () => {
  // Good
  assertLintPluginDiagnostics(
    `
const CONSTANT_NAME = "foo";
const constName = "foo";
let letName = "foo";
var varName = "foo";

// trailing underscore is allowed for avoiding conflicts
const Date_ = Date;

// trailing capital letter is allowed in PascalCase
type FooX = string;

const objectName = {
  methodName() {
  },
  get getName() {
  },
  set setName(value) {
  }
};
function functionName() {
}
class ClassName {}
const ClassName2 = class {};

type TypeName = unknown;
interface InterfaceName {};
enum EnumName {
  foo = "bar",
}

    `,
    [],
  );

  // Bad
  assertLintPluginDiagnostics(
    `
const CONSTANT_name = "foo";

function FunctionName() {
}

function fn() {
  const NESTED_CONSTANT_CASE = "foo";
}

class className {}

type typeName = unknown;

// capital-only acronym name is not PascalCase
// This should be Db, not DB
type DB = {};

interface interfaceName {};
enum enumName {
  foo = "bar",
}


`,
    [
      {
        fix: [],
        hint: undefined,
        id: "deno-style-guide/naming-convention",
        message:
          "Variable name 'CONSTANT_name' is not camelCase, PascalCase, or CONSTANT_CASE.",
        range: [7, 20],
      },
      {
        fix: [{ range: [40, 52], text: "functionName" }],
        hint: undefined,
        id: "deno-style-guide/naming-convention",
        message: "Function name 'FunctionName' is not camelCase.",
        range: [40, 52],
      },
      {
        fix: [{ range: [123, 132], text: "ClassName" }],
        hint: undefined,
        id: "deno-style-guide/naming-convention",
        message: "Class name 'className' is not PascalCase.",
        range: [123, 132],
      },
      {
        fix: [{ range: [142, 150], text: "TypeName" }],
        hint: undefined,
        id: "deno-style-guide/naming-convention",
        message: "Type name 'typeName' is not PascalCase.",
        range: [142, 150],
      },
      {
        fix: [{ range: [244, 246], text: "Db" }],
        hint: undefined,
        id: "deno-style-guide/naming-convention",
        message: "Type name 'DB' is not PascalCase.",
        range: [244, 246],
      },
      {
        fix: [{ range: [264, 277], text: "InterfaceName" }],
        hint: undefined,
        id: "deno-style-guide/naming-convention",
        message: "Interface name 'interfaceName' is not PascalCase.",
        range: [264, 277],
      },
    ] as unknown as Deno.lint.Diagnostic[],
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
new AssertionError("Something went wrong.");

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
// function as last argument is allowed
export function foo(bar: unknown, baz: unknown, bat: () => unknown) {
}
// Pick<T> is usually an object
export function foo(bar: unknown, baz: unknown, bat: Pick<SomeType, "foo">) {
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
        message:
          "Third argument of export function is not an options object or function.",
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

Deno.test("deno-style-guide/copyright-notice", {
  ignore: !Deno.version.deno.startsWith("2"),
}, () => {
  // Good
  assertLintPluginDiagnostics(
    `
// Copyright 2018-2026 the Deno authors. MIT license.
    `,
    [],
    false,
  );

  // Bad
  assertLintPluginDiagnostics(
    `
// Copyright (c) 2023 the Deno authors. MIT license.
    `,
    [
      {
        fix: [],
        hint:
          `Add a copyright notice at the top of the file: // ${COPYRIGHT_NOTICE}`,
        id: "deno-style-guide/copyright",
        message: "Missing copyright notice.",
        range: [0, 0],
      },
    ],
    false,
  );
});
