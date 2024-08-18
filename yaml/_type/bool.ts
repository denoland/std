// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Type } from "../_type.ts";
import { isBoolean } from "../_utils.ts";

const YAML_TRUE_BOOLEANS = ["true", "True", "TRUE"];
const YAML_FALSE_BOOLEANS = ["false", "False", "FALSE"];
const YAML_BOOLEANS = [...YAML_TRUE_BOOLEANS, ...YAML_FALSE_BOOLEANS];

function resolveYamlBoolean(data: string): boolean {
  return YAML_BOOLEANS.includes(data);
}

function constructYamlBoolean(data: string): boolean {
  return YAML_TRUE_BOOLEANS.includes(data);
}

export const bool: Type<"scalar", boolean> = {
  tag: "tag:yaml.org,2002:bool",
  construct: constructYamlBoolean,
  defaultStyle: "lowercase",
  kind: "scalar",
  predicate: isBoolean,
  represent: {
    lowercase(object: boolean): string {
      return object ? "true" : "false";
    },
    uppercase(object: boolean): string {
      return object ? "TRUE" : "FALSE";
    },
    camelcase(object: boolean): string {
      return object ? "True" : "False";
    },
  },
  resolve: resolveYamlBoolean,
};
