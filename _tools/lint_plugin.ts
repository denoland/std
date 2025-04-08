// Copyright 2018-2025 the Deno authors. MIT license.
// @ts-nocheck Deno.lint namespace does not pass type checking in Deno 1.x

/**
 * Lint plugin that enforces the
 * {@link https://docs.deno.com/runtime/contributing/style_guide/ | Deno Style Guide}
 */

const PERIOD_REGEXP = /\.\s/;
const TRAILING_PERIOD_REGEXP = /\.$/;
const LEADING_LOWERCASE_REGEXP = /^[a-z]/;
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
    // https://docs.deno.com/runtime/contributing/style_guide/#error-messages
    "error-message": {
      create(context) {
        return {
          NewExpression(node) {
            if (node.callee.type !== "Identifier") return;
            const name = node.callee.name;
            if (!name.endsWith("Error")) return;
            const argument = node.arguments[0];
            if (argument?.type !== "Literal") return;
            const value = argument.value;
            if (typeof value !== "string") return;

            if (value.match(LEADING_LOWERCASE_REGEXP)) {
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
            if (value.match(TRAILING_PERIOD_REGEXP)) {
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
            if (value.match(PERIOD_REGEXP)) {
              context.report({
                node: argument,
                message: "Error message contains periods.",
                hint:
                  "Remove periods in error message and use a colon for addition information. See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.",
              });
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
