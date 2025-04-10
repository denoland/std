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
    // https://docs.deno.com/runtime/contributing/style_guide/#do-not-depend-on-external-code.
    "no-external-code": {
      create(context) {
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
              message: "External imports are not allowed",
              hint:
                'Use code from within `@std` instead of external code, if possible. E.g. Use `import { foo } from "@std/foo"` instead of `import { foo } from "https://deno.land/std@0.177.0/foo.ts"`.',
            });
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;
