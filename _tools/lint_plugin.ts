// Copyright 2018-2025 the Deno authors. MIT license.
// @ts-nocheck Deno.lint namespace does not pass type checking in Deno 1.x

/**
 * Lint plugin that enforces the
 * {@link https://docs.deno.com/runtime/contributing/style_guide/ | Deno Style Guide}
 */

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
    // https://docs.deno.com/runtime/contributing/style_guide/#prefer-%23-over-private-keyword
    "exported-function-args-maximum": {
      create(context) {
        return {
          ExportNamedDeclaration(node) {
            const declaration = node.declaration;
            if (declaration?.type !== "FunctionDeclaration") return;
            const params = declaration.params;
            const id = declaration.id;
            switch (params.length) {
              case 0:
              case 1:
              case 2:
                break;
              case 3: {
                const param = params.at(-1)!;
                switch (param.type) {
                  case "Identifier":
                    if (param.name === "options") return;
                    break;
                  case "AssignmentPattern": {
                    const left = param.left;
                    if (left.type == "Identifier" && left.name === "options") {
                      return;
                    }
                    break;
                  }
                }

                return context.report({
                  node: id ?? declaration,
                  message:
                    "Third argument of export function is not an options object.",
                  hint:
                    "Export functions can have 0-2 required arguments, plus (if necessary) an options object (so max 3 total).",
                });
              }

              default:
                context.report({
                  node: id ?? declaration,
                  message: "Exported function has more than three arguments.",
                  hint:
                    "Export functions can have 0-2 required arguments, plus (if necessary) an options object (so max 3 total).",
                });
                break;
            }
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;
