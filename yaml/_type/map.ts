// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2025 the Deno authors. MIT license.

import type { Type } from "../_type.ts";

export const map: Type<"mapping", unknown> = {
  tag: "tag:yaml.org,2002:map",
  resolve() {
    return true;
  },
  construct(data) {
    return data !== null ? data : {};
  },
  kind: "mapping",
};
