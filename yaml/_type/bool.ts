// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Type } from "../_type.ts";

const YAML_TRUE_BOOLEANS = ["true", "True", "TRUE"];
const YAML_FALSE_BOOLEANS = ["false", "False", "FALSE"];
const YAML_BOOLEANS = [...YAML_TRUE_BOOLEANS, ...YAML_FALSE_BOOLEANS];

export const bool: Type<"scalar", boolean> = {
  tag: "tag:yaml.org,2002:bool",
  kind: "scalar",
  defaultStyle: "lowercase",
  predicate: (value: unknown): value is boolean => typeof value === "boolean",
  construct: (data: string): boolean => YAML_TRUE_BOOLEANS.includes(data),
  resolve: (data: string): boolean => YAML_BOOLEANS.includes(data),
  represent: {
    lowercase: (object: boolean): string => object ? "true" : "false",
    uppercase: (object: boolean): string => object ? "TRUE" : "FALSE",
    camelcase: (object: boolean): string => object ? "True" : "False",
  },
};
