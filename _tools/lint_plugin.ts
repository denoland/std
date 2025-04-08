// Copyright 2018-2025 the Deno authors. MIT license.
// @ts-nocheck Deno.lint namespace does not pass type checking in Deno 1.x

/**
 * Lint plugin that enforces the
 * {@link https://docs.deno.com/runtime/contributing/style_guide/ | Deno Style Guide}
 */

import { toCamelCase, toPascalCase } from "@std/text";

const PASCAL_CASE_REGEXP = /^[_A-Z][a-z0-9]*(?:[A-Z][a-z0-9]+)*$/;
function isPascalCase(string: string): boolean {
  return PASCAL_CASE_REGEXP.test(string);
}

const CAMEL_CASE_REGEXP = /^[_a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$/;
function isCamelCase(string: string): boolean {
  return CAMEL_CASE_REGEXP.test(string);
}

const CONSTANT_CASE_REGEXP = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;
function isConstantCase(string: string): boolean {
  return CONSTANT_CASE_REGEXP.test(string);
}

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
              if (node.kind === "const" && isConstantCase(name)) return;
              if (!isCamelCase(name)) {
                context.report({
                  node: id,
                  message: `Property name '${name}' is not camelCase.`,
                  fix(fixer) {
                    return fixer.replaceText(id, toCamelCase(name));
                  },
                });
              }
            }
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;
