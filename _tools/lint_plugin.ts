// Copyright 2018-2025 the Deno authors. MIT license.

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
            if (node.accessibility === "private") {
              // TODO(iuioiua): add fix
              context.report({
                node,
                range: node.range,
                message: "Use private field instead",
                hint: "Use #foo() instead of private foo()",
              });
            }
          },
          PropertyDefinition(node) {
            if (node.accessibility === "private") {
              // TODO(iuioiua): add fix
              context.report({
                node,
                range: node.range,
                message: "Use private field instead",
                hint: "Use #foo instead of private foo",
              });
            }
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;
