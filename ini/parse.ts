// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { IniMap, ParseOptions } from "./ini_map.ts";
/** Parse an INI config string into an object. Provide formatting options to override the default assignment operator. */
export function parse(
  text: string,
  options?: ParseOptions,
): Record<string, unknown | Record<string, unknown>> {
  return IniMap.from(text, options).toObject();
}
