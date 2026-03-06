// Copyright 2018-2026 the Deno authors. MIT license.
// Deno.lint namespace does not pass type checking in Deno 1.x

/**
 * Lint plugin that enforces the
 * {@link https://docs.deno.com/runtime/contributing/style_guide/ | Deno Style Guide}
 */

import { toCamelCase, toPascalCase } from "@std/text";
import { toFileUrl } from "@std/path/to-file-url";
import { resolve } from "@std/path/resolve";

const PASCAL_CASE_REGEXP = /^_?(?:[A-Z][a-z0-9]*)*_?$/;
const UPPER_CASE_ONLY_REGEXP = /^_?[A-Z]{2,}$/;
function isPascalCase(string: string): boolean {
  return PASCAL_CASE_REGEXP.test(string) &&
    !UPPER_CASE_ONLY_REGEXP.test(string);
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

export const COPYRIGHT_NOTICE = `Copyright 2018-${
  new Date().getFullYear()
} the Deno authors. MIT license.`;

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
              if (isConstantCase(name)) {
                if (
                  declaration.init?.type === "NewExpression" &&
                  declaration.init.callee.type === "Identifier"
                ) {
                  switch (declaration.init.callee.name) {
                    case "RegExp": {
                      if (name !== "REGEXP" && !name.endsWith("_REGEXP")) {
                        context.report({
                          node: id,
                          message:
                            `RegExp variable name '${name}' must end with _REGEXP.`,
                          fix: (fixer) =>
                            fixer.replaceText(id, `${name}_REGEXP`),
                        });
                      }
                      break;
                    }
                  }
                } else if (
                  declaration.init?.type === "Literal" &&
                  declaration.init.value instanceof RegExp &&
                  name !== "REGEXP" && !name.endsWith("_REGEXP")
                ) {
                  context.report({
                    node: id,
                    message:
                      `RegExp variable name '${name}' must end with _REGEXP.`,
                    fix: (fixer) => fixer.replaceText(id, `${name}_REGEXP`),
                  });
                }
              }
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

            const char = value[0] as string;
            if (char !== char.toUpperCase()) {
              context.report({
                node: argument,
                message: "Error message starts with a lowercase.",
                hint:
                  "Capitalize the error message. See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
                fix(fixer) {
                  const newValue = argument.raw.at(0) +
                    char.toUpperCase() +
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
    // https://docs.deno.com/runtime/contributing/style_guide/#exported-functions%3A-max-2-args%2C-put-the-rest-into-an-options-object
    "exported-function-args-maximum": {
      create(context) {
        const url = toFileUrl(resolve(context.filename));

        // assertions and testing utils generally don't follow this rule
        if (url.href.includes("/assert/")) return {};
        if (url.href.includes("/testing/mock.ts")) return {};
        if (url.href.includes("/testing/unstable_stub.ts")) return {};
        if (url.href.includes("/testing/unstable_stub_property.ts")) return {};
        if (url.href.includes("/testing/snapshot.ts")) return {};
        if (url.href.includes("/testing/unstable_snapshot.ts")) return {};

        // exports from private utils don't need to follow this rule
        if (url.href.includes("/_")) return {};
        // internal exports don't need to follow this rule
        if (url.href.includes("/internal/")) return {};
        // bytes API generally don't follow this rule
        if (url.href.includes("/bytes/")) return {};

        return {
          ExportNamedDeclaration(node) {
            const { declaration } = node;
            if (declaration?.type !== "FunctionDeclaration") return;
            const { params, id } = declaration;
            if (params.length < 3) return;
            if (params.length === 3) {
              const param = params.at(-1)!;

              switch (param.type) {
                case "Identifier": {
                  if (param.name === "options") return;
                  // Function as 3rd argument is valid (e.g. pooledMap)
                  if (
                    param.typeAnnotation?.typeAnnotation?.type ===
                      "TSFunctionType"
                  ) return;

                  // attributes: Pick<T, "foo" | "bar"> as 3rd argument is valid
                  const typeAnn = param.typeAnnotation?.typeAnnotation;
                  const typeRef = typeAnn as Deno.lint.TSTypeReference;
                  const typeName = typeRef?.typeName as Deno.lint.Identifier;
                  if (typeName?.name === "Pick") return;
                  break;
                }
                case "AssignmentPattern": {
                  if (param.right.type === "ObjectExpression") return;
                  break;
                }
              }

              return context.report({
                node: id ?? declaration,
                message:
                  "Third argument of export function is not an options object or function.",
                hint:
                  "Export functions can have 0-2 required arguments, plus (if necessary) an options object (so max 3 total).",
              });
            }
            context.report({
              node: id ?? declaration,
              message: "Exported function has more than three arguments.",
              hint:
                "Export functions can have 0-2 required arguments, plus (if necessary) an options object (so max 3 total).",
            });
          },
        };
      },
    },
    // https://docs.deno.com/runtime/contributing/style_guide/#copyright-headers
    "copyright": {
      create(context) {
        // Skip checking this rule in the ignore_comments.ts file to avoid
        // testing of other rules being affected.
        if (context.filename === "ignore_comments.ts") return {};
        const comments = context.sourceCode.getAllComments();
        // Only check the first 6 comments, for performance
        const node = comments.slice(0, 6).find((comment) =>
          comment.value.includes(COPYRIGHT_NOTICE) && comment.type === "Line"
        );
        if (!node) {
          context.report({
            range: [0, 0],
            message: "Missing copyright notice.",
            hint:
              `Add a copyright notice at the top of the file: // ${COPYRIGHT_NOTICE}`,
          });
        }
        return {};
      },
    },
  },
} as Deno.lint.Plugin;
