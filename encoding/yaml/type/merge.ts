import { Type } from "../type.ts";

function resolveYamlMerge(data: string): boolean {
  return data === "<<" || data === null;
}

export const merge = new Type("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: resolveYamlMerge
});
