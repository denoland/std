// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Type } from "../_type.ts";

function resolveYamlSet(data: Record<PropertyKey, unknown>): boolean {
  if (data === null) return true;

  for (const key in data) {
    if (Object.hasOwn(data, key)) {
      if (data[key] !== null) return false;
    }
  }

  return true;
}

function constructYamlSet(data: string) {
  return data !== null ? data : {};
}

export const set: Type<Record<PropertyKey, unknown>> = {
  tag: "tag:yaml.org,2002:set",
  construct: constructYamlSet,
  kind: "mapping",
  resolve: resolveYamlSet,
};
