// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/** The kind of the type */
export type KindType = "sequence" | "scalar" | "mapping";
/**
 * The style variation for `styles` option of {@linkcode stringify}
 */
export type StyleVariant =
  | "lowercase"
  | "uppercase"
  | "camelcase"
  | "decimal"
  | "binary"
  | "octal"
  | "hexadecimal";

/** The function to represent the value in the given style */
export type RepresentFn<D> = (data: D, style?: StyleVariant) => string;

/**
 * A type definition for a YAML type.
 */
// deno-lint-ignore no-explicit-any
export interface Type<K extends KindType, D = any> {
  /** The tag of the type */
  tag: string;
  /** The kind of the type. */
  kind: K;
  /** The predicate to check if the data is of this type */
  predicate?: (data: unknown) => data is D;
  /** The representation of the value of this type */
  represent?: RepresentFn<D> | Record<string, RepresentFn<D>>;
  /** The default style to use */
  defaultStyle?: StyleVariant;
  /** The function to check if the given YAML node is of this type */
  // deno-lint-ignore no-explicit-any
  resolve: (data: any) => boolean;
  /** The function to create a value of this type from the given YAML text. */
  // deno-lint-ignore no-explicit-any
  construct: (data: any) => D;
}
