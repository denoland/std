// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { Any, ArrayObject } from "./_utils.ts";

export type KindType = "sequence" | "scalar" | "mapping";
export type StyleVariant = "lowercase" | "uppercase" | "camelcase" | "decimal";
export type RepresentFn = (data: Any, style?: StyleVariant) => Any;

export interface Type {
  tag: string;
  kind: KindType | null;
  instanceOf?: Any;
  predicate?: (data: Record<string, unknown>) => boolean;
  represent?: RepresentFn | ArrayObject<RepresentFn>;
  defaultStyle?: StyleVariant;
  styleAliases?: ArrayObject;
  loadKind?: KindType;
  resolve?: (data?: Any) => boolean;
  construct?: (data?: Any) => Any;
}
