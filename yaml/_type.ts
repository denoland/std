// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { ArrayObject } from "./_utils.ts";

export type KindType = "sequence" | "scalar" | "mapping";
/**
 * The style variation for `styles` option of {@linkcode stringify}
 */
export type StyleVariant =
  | "lowercase"
  | "uppercase"
  | "camelcase"
  | "decimal"
  | "dec"
  | 10
  | "binary"
  | "bin"
  | 2
  | "octal"
  | "oct"
  | 8
  | "hexadecimal"
  | "hex"
  | 16;
export type RepresentFn = (data: any, style?: StyleVariant) => any;

export interface Type {
  tag: string;
  kind: KindType | null;
  instanceOf?: any;
  predicate?: (data: Record<string, unknown>) => boolean;
  represent?: RepresentFn | ArrayObject<RepresentFn>;
  defaultStyle?: StyleVariant;
  styleAliases?: ArrayObject;
  loadKind?: KindType;
  resolve: (data?: any) => boolean;
  construct: (data?: any) => any;
}
