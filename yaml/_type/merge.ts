// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Type } from "../_type.ts";

function resolveYamlMerge(data: string): boolean {
  return data === "<<" || data === null;
}

export const merge: Type<unknown> = {
  tag: "tag:yaml.org,2002:merge",
  kind: "scalar",
  resolve: resolveYamlMerge,
  construct(data) {
    return data;
  },
};
