// Copyright 2018-2026 the Deno authors. MIT license.
export interface DenoJson {
  name: string;
  version: string;
  exports: Record<string, string>;
  workspace?: string[];
}

async function importJson(path: string): Promise<DenoJson> {
  return (await import(path, { with: { type: "json" } })).default;
}

export async function getPackagesDenoJsons(): Promise<DenoJson[]> {
  const { workspace } = await importJson("../deno.json");
  return Promise.all(
    workspace!.map((path) => importJson(`../${path}/deno.json`)),
  );
}

export async function getEntrypoints(): Promise<string[]> {
  return (await getPackagesDenoJsons())
    .flatMap(({ name, exports }) =>
      Object.keys(exports).map((mod) =>
        mod === "." ? name : name + mod.slice(1)
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
