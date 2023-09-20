// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { createExtractor, Parser } from "./create_extractor.ts";
import { Format } from "./_formats.ts";
import { parse as parseYAML } from "../yaml/parse.ts";
import { parse as parseTOML } from "../toml/parse.ts";

export { Format } from "./_formats.ts";
export { test } from "./test.ts";
export const extract = createExtractor({
  [Format.YAML]: parseYAML as Parser,
  [Format.TOML]: parseTOML as Parser,
  [Format.JSON]: JSON.parse as Parser,
});
/** @deprecated (will be removed after 0.210.0) import `extract` (named export) instead. */
export default extract;
