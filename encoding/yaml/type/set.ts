import { Type } from "../type.ts";
import { Any } from "../utils.ts";

const _hasOwnProperty = Object.prototype.hasOwnProperty;

function resolveYamlSet(data: Any): boolean {
  if (data === null) return true;

  for (const key in data) {
    if (_hasOwnProperty.call(data, key)) {
      if (data[key] !== null) return false;
    }
  }

  return true;
}

function constructYamlSet(data: string): Any {
  return data !== null ? data : {};
}

export const set = new Type("tag:yaml.org,2002:set", {
  construct: constructYamlSet,
  kind: "mapping",
  resolve: resolveYamlSet
});
