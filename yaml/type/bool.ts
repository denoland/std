import { Type } from "../Type.ts";
import { isBoolean } from "../utils.ts";

function resolveYamlBoolean(data: string) {
  const max = data.length;

  return (
    (max === 4 && (data === "true" || data === "True" || data === "TRUE")) ||
    (max === 5 && (data === "false" || data === "False" || data === "FALSE"))
  );
}

function constructYamlBoolean(data: string) {
  return data === "true" || data === "True" || data === "TRUE";
}

export const bool = new Type("tag:yaml.org,2002:bool", {
  construct: constructYamlBoolean,
  defaultStyle: "lowercase",
  kind: "scalar",
  predicate: isBoolean,
  represent: {
    lowercase(object: boolean) {
      return object ? "true" : "false";
    },
    uppercase(object: boolean) {
      return object ? "TRUE" : "FALSE";
    },
    camelcase(object: boolean) {
      return object ? "True" : "False";
    }
  },
  resolve: resolveYamlBoolean
});
