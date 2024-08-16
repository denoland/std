// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { KindType, Type } from "./_type.ts";
import {
  binary,
  bool,
  float,
  int,
  map,
  merge,
  nil,
  omap,
  pairs,
  regexp,
  seq,
  set,
  str,
  timestamp,
  undefinedType,
} from "./_type/mod.ts";

/**
 * Name of the schema to use.
 *
 * > [!NOTE]
 * > It is recommended to use the schema that is most appropriate for your use
 * > case. Doing so will avoid any unnecessary processing and benefit
 * > performance.
 *
 * Options include:
 * - `failsafe`: supports generic mappings, generic sequences and generic
 * strings.
 * - `json`: extends `failsafe` schema by also supporting nulls, booleans,
 * integers and floats.
 * - `core`: functionally the same as `json` schema.
 * - `default`: extends `core` schema by also supporting binary, omap, pairs and
 * set types.
 * - `extended`: extends `default` schema by also supporting regular
 * expressions and undefined values.
 *
 * See
 * {@link https://yaml.org/spec/1.2.2/#chapter-10-recommended-schemas | YAML 1.2 spec}
 * for more details on the `failsafe`, `json` and `core` schemas.
 */
export type SchemaType = "failsafe" | "json" | "core" | "default" | "extended";

type ImplicitType = Type<"scalar">;
type ExplicitType = Type<KindType>;

function compileImplicitTypes<T extends ImplicitType>(
  schema: Schema,
): T[] {
  const result = [];
  for (const includedSchema of schema.include) {
    result.push(...compileImplicitTypes<T>(includedSchema));
  }
  for (const type of schema.implicitTypes) {
    if (!result.some((it) => it.tag == type.tag && it.kind === type.kind)) {
      result.push(type as T);
    }
  }
  return result;
}
function compileExplicitTypes<T extends ExplicitType>(
  schema: Schema,
): T[] {
  const result = [];
  for (const includedSchema of schema.include) {
    result.push(...compileExplicitTypes<T>(includedSchema));
  }
  for (const type of schema.explicitTypes) {
    if (!result.some((it) => it.tag == type.tag && it.kind === type.kind)) {
      result.push(type as T);
    }
  }
  return result;
}

export type TypeMap = Record<
  KindType | "fallback",
  Map<string, ExplicitType>
>;
function compileMap(
  implicitTypes: ImplicitType[],
  explicitTypes: ExplicitType[],
): TypeMap {
  const result: TypeMap = {
    fallback: new Map(),
    mapping: new Map(),
    scalar: new Map(),
    sequence: new Map(),
  };

  const fallbackMap = result["fallback"];
  for (const types of [implicitTypes, explicitTypes]) {
    for (const type of types) {
      const map = result[type.kind];
      map.set(type.tag, type);
      fallbackMap.set(type.tag, type);
    }
  }
  return result;
}

export class Schema {
  implicitTypes: ImplicitType[];
  explicitTypes: ExplicitType[];
  include: Schema[];

  compiledImplicitTypes: ImplicitType[];
  compiledExplicitTypes: ExplicitType[];
  compiledTypeMap: TypeMap;

  constructor({ explicit = [], implicit = [], include = [] }: {
    implicit?: ImplicitType[];
    explicit?: ExplicitType[];
    include?: Schema[];
  }) {
    this.explicitTypes = explicit;
    this.implicitTypes = implicit;
    this.include = include;
    this.compiledImplicitTypes = compileImplicitTypes(this);
    this.compiledExplicitTypes = compileExplicitTypes(this);
    this.compiledTypeMap = compileMap(
      this.compiledImplicitTypes,
      this.compiledExplicitTypes,
    );
  }
}

/**
 * Standard YAML's failsafe schema.
 *
 * @see {@link http://www.yaml.org/spec/1.2/spec.html#id2802346}
 */
const FAILSAFE_SCHEMA = new Schema({
  explicit: [str, seq, map],
});

/**
 * Standard YAML's JSON schema.
 *
 * @see {@link http://www.yaml.org/spec/1.2/spec.html#id2803231}
 */
const JSON_SCHEMA = new Schema({
  implicit: [nil, bool, int, float],
  include: [FAILSAFE_SCHEMA],
});

/**
 * Standard YAML's core schema.
 *
 * @see {@link http://www.yaml.org/spec/1.2/spec.html#id2804923}
 */
const CORE_SCHEMA = new Schema({
  include: [JSON_SCHEMA],
});

/**
 * Default YAML schema. It is not described in the YAML specification.
 */
export const DEFAULT_SCHEMA = new Schema({
  explicit: [binary, omap, pairs, set],
  implicit: [timestamp, merge],
  include: [CORE_SCHEMA],
});

/***
 * Extends JS-YAML default schema with additional JavaScript types
 * It is not described in the YAML specification.
 * Functions are no longer supported for security reasons.
 *
 * @example
 * ```ts
 * import { parse } from "@std/yaml";
 *
 * const data = parse(
 *   `
 *   regexp:
 *     simple: !!js/regexp foobar
 *     modifiers: !!js/regexp /foobar/mi
 *   undefined: !!js/undefined ~
 * # Disabled, see: https://github.com/denoland/deno_std/pull/1275
 * #  function: !!js/function >
 * #    function foobar() {
 * #      return 'hello world!';
 * #    }
 * `,
 *   { schema: "extended" },
 * );
 * ```
 */
const EXTENDED_SCHEMA = new Schema({
  explicit: [regexp, undefinedType],
  include: [DEFAULT_SCHEMA],
});

export const SCHEMA_MAP = new Map([
  ["core", CORE_SCHEMA],
  ["default", DEFAULT_SCHEMA],
  ["failsafe", FAILSAFE_SCHEMA],
  ["json", JSON_SCHEMA],
  ["extended", EXTENDED_SCHEMA],
]);
