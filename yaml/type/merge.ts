import { Type } from "../Type.ts";

function resolveYamlMerge(data: string) {
  return data === "<<" || data === null;
}

export const merge = new Type("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: resolveYamlMerge
});
