import { Type } from "../Type.ts";

const _hasOwnProperty = Object.prototype.hasOwnProperty;

function resolveYamlSet(data: any) {
  if (data === null) return true;

  for (const key in data) {
    if (_hasOwnProperty.call(data, key)) {
      if (data[key] !== null) return false;
    }
  }

  return true;
}

function constructYamlSet(data: string) {
  return data !== null ? data : {};
}

export const set = new Type("tag:yaml.org,2002:set", {
  construct: constructYamlSet,
  kind: "mapping",
  resolve: resolveYamlSet
});
