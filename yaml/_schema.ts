// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { YamlError } from "./_error.ts";
import type { KindType, Type } from "./_type.ts";
import type { ArrayObject } from "./_utils.ts";
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

function compileList(
  schema: Schema,
  name: "implicit" | "explicit",
  result: Type[],
): Type[] {
  const exclude: number[] = [];

  for (const includedSchema of schema.include) {
    result = compileList(includedSchema, name, result);
  }

  for (const currentType of schema[name]) {
    for (const [previousIndex, previousType] of result.entries()) {
      if (
        previousType.tag === currentType.tag &&
        previousType.kind === currentType.kind
      ) {
        exclude.push(previousIndex);
      }
    }

    result.push(currentType);
  }

  return result.filter((_type, index): unknown => !exclude.includes(index));
}

export type TypeMap = Record<KindType | "fallback", ArrayObject<Type<unknown>>>;
function compileMap(...typesList: Type<unknown>[][]): TypeMap {
  const result: TypeMap = {
    fallback: {},
    mapping: {},
    scalar: {},
    sequence: {},
  };

  for (const types of typesList) {
    for (const type of types) {
      if (type.kind !== null) {
        result[type.kind][type.tag] = result["fallback"][type.tag] = type;
      }
    }
  }
  return result;
}

export class Schema {
  implicit: Type[];
  explicit: Type[];
  include: Schema[];

  compiledImplicit: Type[];
  compiledExplicit: Type[];
  compiledTypeMap: TypeMap;

  constructor(definition: {
    implicit?: Type[];
    explicit?: Type[];
    include?: Schema[];
  }) {
    this.explicit = definition.explicit || [];
    this.implicit = definition.implicit || [];
    this.include = definition.include || [];

    for (const type of this.implicit) {
      if (type.loadKind && type.loadKind !== "scalar") {
        throw new YamlError(
          "There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.",
        );
      }
    }

    this.compiledImplicit = compileList(this, "implicit", []);
    this.compiledExplicit = compileList(this, "explicit", []);
    this.compiledTypeMap = compileMap(
      this.compiledImplicit,
      this.compiledExplicit,
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
