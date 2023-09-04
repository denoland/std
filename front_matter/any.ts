// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { createExtractor, Format, Parser, test as _test } from "./mod.ts";
import { parse as parseYAML } from "../yaml/parse.ts";
import { parse as parseTOML } from "../toml/parse.ts";

export { Format, test } from "./mod.ts";
export const extract = createExtractor({
  [Format.YAML]: parseYAML as Parser,
  [Format.TOML]: parseTOML as Parser,
  [Format.JSON]: JSON.parse as Parser,
});
export default extract;
