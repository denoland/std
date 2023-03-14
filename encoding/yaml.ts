// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * @deprecated (will be removed after 0.182.0) Import from `std/yaml` instead.
 *
 * {@linkcode parse} and {@linkcode stringify} for handling
 * [YAML](https://yaml.org/) encoded data.
 *
 * Ported from
 * [js-yaml v3.13.1](https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da)
 *
 * If your YAML contains multiple documents in it, you can use {@linkcode parseAll} for
 * handling it.
 *
 * To handle `regexp`, and `undefined` types, use {@linkcode EXTENDED_SCHEMA}.
 * You can also use custom types by extending schemas.
 *
 * ## :warning: Limitations
 * - `binary` type is currently not stable.
 *
 * For further examples see https://github.com/nodeca/js-yaml/tree/master/examples.
 * @example
 * ```ts
 * import {
 *   parse,
 *   stringify,
 * } from "https://deno.land/std@$STD_VERSION/yaml/mod.ts";
 *
 * const data = parse(`
 * foo: bar
 * baz:
 *   - qux
 *   - quux
 * `);
 * console.log(data);
 * // => { foo: "bar", baz: [ "qux", "quux" ] }
 *
 * const yaml = stringify({ foo: "bar", baz: ["qux", "quux"] });
 * console.log(yaml);
 * // =>
 * // foo: bar
 * // baz:
 * //   - qux
 * //   - quux
 * ```
 *
 * @module
 */

export {
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/parse.ts` instead. */
  parse,
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/parse.ts` instead. */
  parseAll,
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/parse.ts` instead. */
  type ParseOptions,
} from "../yaml/parse.ts";
export {
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/stringify.ts` instead. */
  type DumpOptions as StringifyOptions,
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/stringify.ts` instead. */
  stringify,
} from "../yaml/stringify.ts";
export type {
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/schema.ts` instead. */
  SchemaDefinition,
} from "../yaml/schema.ts";
export type {
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/type.ts` instead. */
  KindType,
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/type.ts` instead. */
  RepresentFn,
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/type.ts` instead. */
  StyleVariant,
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/type.ts` instead. */
  Type,
} from "../yaml/type.ts";
export {
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/schema/mod.ts` instead. */
  CORE_SCHEMA,
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/schema/mod.ts` instead. */

  DEFAULT_SCHEMA,
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/schema/mod.ts` instead. */

  EXTENDED_SCHEMA,
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/schema/mod.ts` instead. */

  FAILSAFE_SCHEMA,
  /** @deprecated (will be removed after 0.182.0) Import from `std/yaml/schema/mod.ts` instead. */

  JSON_SCHEMA,
} from "../yaml/schema/mod.ts";
