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
    ],
  );
});
