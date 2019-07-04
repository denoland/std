import { Type } from "../Type.ts";

function resolveYamlNull(data: string) {
  const max = data.length;

  return (
    (max === 1 && data === "~") ||
    (max === 4 && (data === "null" || data === "Null" || data === "NULL"))
  );
}

function constructYamlNull() {
  return null;
}

function isNull(object: any) {
  return object === null;
}

export const nil = new Type("tag:yaml.org,2002:null", {
  construct: constructYamlNull,
  defaultStyle: "lowercase",
  kind: "scalar",
  predicate: isNull,
  represent: {
    canonical() {
      return "~";
    },
    lowercase() {
      return "null";
    },
    uppercase() {
      return "NULL";
    },
    camelcase() {
      return "Null";
    }
  },
  resolve: resolveYamlNull
});
