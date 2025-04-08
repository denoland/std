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

Deno.test("deno-style-guide/variable-name", {
  ignore: !Deno.version.deno.startsWith("2"),
}, () => {
  // Good
  assertLintPluginDiagnostics(
    `
const CONSTANT_NAME = "foo";
const constName = "foo";
let letName = "foo";
var varName = "foo";

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
const ConstName = "foo";
let LetName = "foo";
let LET_NAME = "foo";
var VarName = "foo";
let VAR_NAME = "foo";

const ObjectName = {
  MethodName() {
  },
  get GetName() {
  },
  set SetName(value: unknown) {
  },
};
function FunctionName() {
}

function fn() {
  const NESTED_CONSTANT_CASE = "foo";
}

class className {}

type typeName = unknown;
interface interfaceName {};
enum enumName {
  foo = "bar",
}

`,
    [
      {
        fix: [{ range: [7, 20], text: "constantName" }],
        hint: undefined,
        id: "deno-style-guide/variable-name",
        message: "Property name 'CONSTANT_name' is not camelCase.",
        range: [7, 20],
      },
      {
        fix: [{ range: [36, 45], text: "constName" }],
        hint: undefined,
        id: "deno-style-guide/variable-name",
        message: "Property name 'ConstName' is not camelCase.",
        range: [36, 45],
      },
      {
        fix: [{ range: [59, 66], text: "letName" }],
        hint: undefined,
        id: "deno-style-guide/variable-name",
        message: "Property name 'LetName' is not camelCase.",
        range: [59, 66],
      },
      {
        fix: [{ range: [80, 88], text: "letName" }],
        hint: undefined,
        id: "deno-style-guide/variable-name",
        message: "Property name 'LET_NAME' is not camelCase.",
        range: [80, 88],
      },
      {
        fix: [{ range: [102, 109], text: "varName" }],
        hint: undefined,
        id: "deno-style-guide/variable-name",
        message: "Property name 'VarName' is not camelCase.",
        range: [102, 109],
      },
      {
        fix: [{ range: [123, 131], text: "varName" }],
        hint: undefined,
        id: "deno-style-guide/variable-name",
        message: "Property name 'VAR_NAME' is not camelCase.",
        range: [123, 131],
      },
      {
        fix: [{ range: [148, 158], text: "objectName" }],
        hint: undefined,
        id: "deno-style-guide/variable-name",
        message: "Property name 'ObjectName' is not camelCase.",
        range: [148, 158],
      },
      {
        fix: [{ range: [257, 269], text: "functionName" }],
        hint: undefined,
        id: "deno-style-guide/variable-name",
        message: "Function name 'FunctionName' is not camelCase.",
        range: [257, 269],
      },
      {
        fix: [{ range: [301, 321], text: "nestedConstantCase" }],
        hint: undefined,
        id: "deno-style-guide/variable-name",
        message: "Property name 'NESTED_CONSTANT_CASE' is not camelCase.",
        range: [301, 321],
      },
      {
        fix: [{ range: [340, 349], text: "ClassName" }],
        hint: undefined,
        id: "deno-style-guide/variable-name",
        message: "Class name 'className' is not PascalCase.",
        range: [340, 349],
      },
      {
        fix: [{ range: [359, 367], text: "TypeName" }],
        hint: undefined,
        id: "deno-style-guide/variable-name",
        message: "Type name 'typeName' is not PascalCase.",
        range: [359, 367],
      },
      {
        fix: [{ range: [389, 402], text: "InterfaceName" }],
        hint: undefined,
        id: "deno-style-guide/variable-name",
        message: "Interface name 'interfaceName' is not PascalCase.",
        range: [389, 402],
      },
    ],
  );
});
