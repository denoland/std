// Copyright 2018-2025 the Deno authors. MIT license.

const MORE_DETAILS_MESSAGE =
  "See https://docs.deno.com/runtime/contributing/style_guide/#error-messages for more details.";

const PERIOD_REGEXP = /\.\s/;
const TRAILING_PERIOD_REGEXP = /\.$/;
const LEADING_LOWERCASE_REGEXP = /^[a-z]/;
const CONTRACTION_REGEXP = /\S'\S/;

const plugin: Deno.lint.Plugin = {
  name: "deno-style-guide",
  rules: {
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
                message: "Error message should start with an uppercase.",
                hint: MORE_DETAILS_MESSAGE,
                fix(fixer) {
                  const newValue = argument.raw.at(0) +
                    value[0]!.toUpperCase() +
                    value.slice(1) +
                    argument.raw.at(-1);
                  return fixer.replaceText(argument, newValue);
                },
              });
            }
            if (value.match(TRAILING_PERIOD_REGEXP)) {
              context.report({
                node: argument,
                message: "Error message should not end with a period.",
                hint: MORE_DETAILS_MESSAGE,
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
                message: `Error message should not contain periods.`,
                hint: MORE_DETAILS_MESSAGE,
              });
            }
            if (value.match(CONTRACTION_REGEXP)) {
              context.report({
                node: argument,
                message: `Error message should not use contractions.`,
                hint: MORE_DETAILS_MESSAGE,
              });
            }
          },
        };
      },
    },
  },
};

export default plugin;
