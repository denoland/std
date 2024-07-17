// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Type } from "../_type.ts";
import { getObjectTypeString } from "../_utils.ts";

// deno-lint-ignore no-explicit-any
function resolveYamlOmap(data: any): boolean {
  const objectKeys: string[] = [];
  let pairKey = "";
  let pairHasKey = false;

  for (const pair of data) {
    pairHasKey = false;

    if (getObjectTypeString(pair) !== "[object Object]") {
      return false;
    }

    for (pairKey in pair) {
      if (Object.hasOwn(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }

    if (!pairHasKey) return false;

    if (!objectKeys.includes(pairKey)) objectKeys.push(pairKey);
    else return false;
  }

  return true;
}

export const omap: Type<Record<PropertyKey, unknown>[]> = {
  tag: "tag:yaml.org,2002:omap",
  kind: "sequence",
  resolve: resolveYamlOmap,
  construct(data) {
    return data;
  },
};
