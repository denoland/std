// Copyright 2018-2025 the Deno authors. MIT license.

import ts from "npm:typescript";
import ROOT_DENO_JSON from "../deno.json" with { type: "json" };

export interface DenoJson {
  name: string;
  version: string;
  exports: Record<string, string>;
}

export function resolve(
  specifier: string,
  referrer: string,
) {
  return (specifier.startsWith("../") || specifier.startsWith("./"))
    ? new URL(specifier, referrer).href
    : import.meta.resolve(specifier);
}

export async function getEntrypoints(): Promise<string[]> {
  const { workspace } = ROOT_DENO_JSON;
  const packagesDenoJsons = await Promise.all(workspace.map(async (path) => {
    return (await import(`../${path}/deno.json`, { with: { type: "json" } }))
      .default as DenoJson;
  }));
  return packagesDenoJsons.flatMap((denoJson) =>
    Object.values(denoJson.exports).map((path) =>
      path === "." ? denoJson.name : import.meta.resolve(
        `../${denoJson.name}/${path}`,
      )
    )
  );
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
