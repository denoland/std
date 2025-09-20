// Copyright 2018-2025 the Deno authors. MIT license.

function isInternalFile(filename: string): boolean {
  return filename.split("/").some((part) => part.startsWith("_"));
}

export default {
  name: "deno-std-docs",
  rules: {
    "exported-symbol-documented": {
      create(context) {
        return {
          ExportNamedDeclaration(node) {
            if (isInternalFile(context.filename)) return;
            const comments = context.sourceCode.getCommentsBefore(node);
            const hasDocComment = comments.some((comment) =>
              comment.type === "Block" && comment.value.startsWith("*")
            );
            if (!hasDocComment) {
              context.report({
                node,
                message: "Exported symbol is missing a documentation comment.",
                hint: "Add a documentation comment above the symbol.",
              });
            }
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;
