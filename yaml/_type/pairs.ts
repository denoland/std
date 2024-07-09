// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Type } from "../_type.ts";
import { getObjectTypeString } from "../_utils.ts";

function resolveYamlPairs(data: unknown[][]): boolean {
  if (data === null) return true;

  const result = Array.from({ length: data.length });

  for (const [index, pair] of data.entries()) {
    if (getObjectTypeString(pair) !== "[object Object]") {
      return false;
    }

    const keys = Object.keys(pair);

    if (keys.length !== 1) return false;

    // deno-lint-ignore no-explicit-any
    result[index] = [keys[0], pair[keys[0] as any]];
  }

  return true;
}
function constructYamlPairs(data: string) {
  if (data === null) return [];

  const result = Array.from({ length: data.length });

  for (let index = 0; index < data.length; index += 1) {
    const pair = data[index]!;

    const keys = Object.keys(pair);

    // deno-lint-ignore no-explicit-any
    result[index] = [keys[0], pair[keys[0] as any]];
  }

  return result;
}

export const pairs: Type = {
  tag: "tag:yaml.org,2002:pairs",
  construct: constructYamlPairs,
  kind: "sequence",
  resolve: resolveYamlPairs,
};
