// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { CORE_SCHEMA } from "./core.ts";
export { CORE_SCHEMA } from "./core.ts";
import { DEFAULT_SCHEMA } from "./default.ts";
export { DEFAULT_SCHEMA } from "./default.ts";
import { EXTENDED_SCHEMA } from "./extended.ts";
export { EXTENDED_SCHEMA } from "./extended.ts";
import { FAILSAFE_SCHEMA } from "./failsafe.ts";
export { FAILSAFE_SCHEMA } from "./failsafe.ts";
import { JSON_SCHEMA } from "./json.ts";
export { JSON_SCHEMA } from "./json.ts";

export function replaceSchemaNameWithSchemaClass(
  // deno-lint-ignore no-explicit-any
  options?: { schema?: any },
) {
  if (!options) return;
  const name = options?.schema;
  if (name === "core") {
    options.schema = CORE_SCHEMA;
  } else if (name === "default") {
    options.schema = DEFAULT_SCHEMA;
  } else if (name === "failsafe") {
    options.schema = FAILSAFE_SCHEMA;
  } else if (name === "json") {
    options.schema = JSON_SCHEMA;
  } else if (name === "extended") {
    options.schema = EXTENDED_SCHEMA;
  }
}
