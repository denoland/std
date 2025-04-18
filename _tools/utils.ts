// Copyright 2018-2025 the Deno authors. MIT license.

import ts from "npm:typescript";

export function resolve(
  specifier: string,
  referrer: string,
) {
  return (specifier.startsWith("./") || specifier.startsWith("../"))
    ? new URL(specifier, referrer).href
    : import.meta.resolve(specifier);
}

/**
 * Checks whether a file is named `test.ts` and has no exports.
 * @param filePath
 * @returns true if file is named `test.ts` and has no exports, false otherwise
 */
export function isTestFile(filePath: string): boolean {
  if (!filePath.endsWith("test.ts")) return false;
  const source = Deno.readTextFileSync(filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
  );

  let result = true;

  function visitNode(node: ts.Node) {
    if (!result) return;
    if (
      ts.isExportSpecifier(node) ||
      ts.isExportAssignment(node) ||
      ts.isExportDeclaration(node) ||
      node.kind === ts.SyntaxKind.ExportKeyword
    ) {
      result = false;
    } else {
      ts.forEachChild(node, visitNode);
    }
  }

  visitNode(sourceFile);
  return result;
}
