// Copyright 2018-2025 the Deno authors. MIT license.
// @ts-nocheck Deno.lint namespace does not pass type checking in Deno 1.x

/**
 * Lint plugin that enforces the
 * {@link https://docs.deno.com/runtime/contributing/style_guide/ | Deno Style Guide}
 */

import { toCamelCase, toPascalCase } from "@std/text";

const PASCAL_CASE_REGEXP = /^_?(?:[A-Z][a-z0-9]*)*_?$/;
const UPPER_CASE_ONLY = /^_?[A-Z]{2,}$/;
function isPascalCase(string: string): boolean {
  return PASCAL_CASE_REGEXP.test(string) && !UPPER_CASE_ONLY.test(string);
}

const CAMEL_CASE_REGEXP = /^[_a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*_?$/;
function isCamelCase(string: string): boolean {
  return CAMEL_CASE_REGEXP.test(string);
}

const CONSTANT_CASE_REGEXP = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_?$/;
function isConstantCase(string: string): boolean {
  return CONSTANT_CASE_REGEXP.test(string);
}

const CONTRACTION_REGEXP = /\S'\S/;

export default {
  name: "deno-style-guide",
  rules: {
    // https://docs.deno.com/runtime/contributing/style_guide/#prefer-%23-over-private-keyword
    "prefer-private-field": {
      create(context) {
        return {
          MethodDefinition(node) {
            if (node.accessibility !== "private") return;
            // TODO(iuioiua): add fix
            context.report({
              node,
              range: node.range,
              message: "Method uses `private` keyword",
              hint:
                "Use private field (`#`) instead of the `private` keyword. E.g. Use `#foo()` instead of `private foo()`.",
            });
          },
          PropertyDefinition(node) {
            if (node.accessibility !== "private") return;
            // TODO(iuioiua): add fix
            context.report({
              node,
              range: node.range,
              message: "Property uses `private` keyword",
              hint:
                "Use private field (`#`) instead of the `private` keyword. E.g. Use `#foo` instead of `private foo`.",
            });
          },
        };
      },
    },
    // https://docs.deno.com/runtime/contributing/style_guide/#top-level-functions-should-not-use-arrow-syntax
    "no-top-level-arrow-syntax": {
      create(context) {
        return {
          ArrowFunctionExpression(node) {
            if (
              node.parent.type === "VariableDeclarator" &&
              node.parent.parent.type === "VariableDeclaration" &&
              (node.parent.parent.parent.type === "Program" ||
                node.parent.parent.parent.type === "ExportNamedDeclaration")
            ) {
              // TODO(iuioiua): add fix
              context.report({
                node,
                range: node.range,
                message: "Top-level functions should not use arrow syntax",
                hint:
                  "Use function declaration instead of arrow function. E.g. Use `function foo() {}` instead of `const foo = () => {}`.",
              });
            }
          },
        };
      },
    },
    // https://docs.deno.com/runtime/contributing/style_guide/#do-not-depend-on-external-code.
    "no-external-code": {
      create(context) {
        if (context.filename.includes("_tools")) {
          // Tools are allowed to use external code
          return {};
        }
        return {
          ImportDeclaration(node) {
            const resolvedSpecifier = import.meta.resolve(node.source.value);
            if (
              resolvedSpecifier.startsWith("file:") ||
              resolvedSpecifier.startsWith("jsr:@std") ||
              resolvedSpecifier.startsWith("jsr:/@std") ||
              resolvedSpecifier.startsWith("node:")
            ) {
              return;
            }
            context.report({
              node,
              range: node.source.range,
              message: "External imports are not allowed outside of tools",
              hint:
                'Use code from within `@std` instead of external code. E.g. Use `import { foo } from "@std/foo"` instead of `import { foo } from "https://deno.land/x/foo/mod.ts"`.',
            });
          },
        };
      },
    },
    // https://docs.deno.com/runtime/contributing/style_guide/#naming-convention/
    "naming-convention": {
      create(context) {
        return {
          TSTypeAliasDeclaration(node) {
            const name = node.id.name;
            if (!name) return;
            if (!isPascalCase(name)) {
              context.report({
                node: node.id,
                message: `Type name '${name}' is not PascalCase.`,
                fix(fixer) {
                  return fixer.replaceText(node.id, toPascalCase(name));
                },
              });
            }
          },
          TSInterfaceDeclaration(node) {
            const name = node.id.name;
            if (!name) return;
            if (!isPascalCase(name)) {
              context.report({
                node: node.id,
                message: `Interface name '${name}' is not PascalCase.`,
                fix(fixer) {
                  return fixer.replaceText(node.id, toPascalCase(name));
                },
              });
            }
          },
          TSEnumDeclaration(node) {
            const name = node.id.name;
            if (!name) return;
            if (!isPascalCase(name)) {
              context.report({
                node: node.id,
                message: `Enum name '${name}' is not PascalCase.`,
                fix(fixer) {
                  return fixer.replaceText(node.id, toPascalCase(name));
                },
              });
            }
          },
          FunctionDeclaration(node) {
            const id = node.id;
            if (!id) return;
            const name = id.name;
            if (!name) return;
            if (!isCamelCase(name)) {
              context.report({
                node: id,
                message: `Function name '${name}' is not camelCase.`,
                fix(fixer) {
                  return fixer.replaceText(id, toCamelCase(name));
                },
              });
            }
          },
          ClassDeclaration(node) {
            const id = node.id;
            if (!id) return;
            const name = id.name;
            if (!name) return;
            if (!isPascalCase(name)) {
              context.report({
                node: id,
                message: `Class name '${name}' is not PascalCase.`,
                fix(fixer) {
                  return fixer.replaceText(id, toPascalCase(name));
                },
              });
            }
          },
          MethodDefinition(node) {
            const key = node.key;
            if (key.type !== "Identifier") return;
            const name = key.name;
            if (!name) return;
            if (!isCamelCase(name)) {
              context.report({
                node: key,
                message: `Method name '${name}' is not camelCase.`,
                fix(fixer) {
                  return fixer.replaceText(key, toCamelCase(name));
                },
              });
            }
          },
          PropertyDefinition(node) {
            const key = node.key;
            switch (key.type) {
              case "Identifier":
              case "PrivateIdentifier": {
                const name = key.name;
                if (!name) return;
                if (!isCamelCase(name)) {
                  context.report({
                    node: key,
                    message: `Property name '${name}' is not camelCase.`,
                    fix(fixer) {
                      return fixer.replaceText(key, toCamelCase(name));
                    },
                  });
                }
                break;
              }
              default:
                break;
            }
          },
          VariableDeclaration(node) {
            for (const declaration of node.declarations) {
              const id = declaration.id;
              if (id.type !== "Identifier") return;
              const name = id.name;
              if (!name) return;
              if (
                !isConstantCase(name) && !isCamelCase(name) &&
                !isPascalCase(name)
              ) {
                context.report({
                  node: id,
                  message:
                    `Variable name '${name}' is not camelCase, PascalCase, or CONSTANT_CASE.`,
                });
              }
            }
          },
        };
      },
    },
    // https://docs.deno.com/runtime/contributing/style_guide/#error-messages
    "error-message": {
      create(context) {
        if (context.filename.endsWith("test.ts")) {
          return {};
        }
        return {
          NewExpression(node) {
            if (node.callee.type !== "Identifier") return;
            const name = node.callee.name;
            if (!name.endsWith("Error")) return;
            const argument = node.arguments[0];
            if (argument?.type !== "Literal") return;
            const value = argument.value;
            if (typeof value !== "string") return;

            if (value[0] !== value[0].toUpperCase()) {
              context.report({
                node: argument,
                message: "Error message starts with a lowercase.",
                hint:
                  "Capitalize the error message. See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
                fix(fixer) {
                  const newValue = argument.raw.at(0) +
                    value[0].toUpperCase() +
                    value.slice(1) +
                    argument.raw.at(-1);
                  return fixer.replaceText(argument, newValue);
                },
              });
            }
            if (name !== "AssertionError") {
              // AssertionError is allowed to have a period in the message
              if (value.endsWith(".")) {
                context.report({
                  node: argument,
                  message: "Error message ends with a period.",
                  hint:
                    "Remove the period at the end of the error message. See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
                  fix(fixer) {
                    const newValue = argument.raw.at(0) +
                      value.slice(0, -1) +
                      argument.raw.at(-1);
                    return fixer.replaceText(argument, newValue);
                  },
                });
              }
              if (value.includes(". ")) {
                context.report({
                  node: argument,
                  message: "Error message contains periods.",
                  hint:
                    "Remove periods in error message and use a colon for addition information. See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
                });
              }
            }
            if (value.match(CONTRACTION_REGEXP)) {
              context.report({
                node: argument,
                message: "Error message uses contractions.",
                hint:
                  "Use the full form in error message. See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
              });
            }
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;
