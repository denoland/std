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
    }],
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
