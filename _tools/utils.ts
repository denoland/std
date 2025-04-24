// Copyright 2018-2025 the Deno authors. MIT license.
import ROOT_DENO_JSON from "../deno.json" with { type: "json" };
import ts from "npm:typescript";

export interface DenoJson {
  name: string;
  version: string;
  exports: Record<string, string>;
}

export async function getEntrypoints(): Promise<string[]> {
  const { workspace } = ROOT_DENO_JSON;
  const packagesDenoJsons = await Promise.all(workspace.map(async (path) => {
    return (await import(`../${path}/deno.json`, { with: { type: "json" } }))
      .default as DenoJson;
  }));
  return packagesDenoJsons.flatMap((denoJson) =>
    Object.keys(denoJson.exports).map((mod) =>
      mod === "." ? denoJson.name : `${denoJson.name}/${mod}`
    )
  );
}

export function resolve(
  specifier: string,
  referrer: string,
) {
  return (specifier.startsWith("./") || specifier.startsWith("../"))
    ? new URL(specifier, referrer).href
    : import.meta.resolve(specifier);
}
