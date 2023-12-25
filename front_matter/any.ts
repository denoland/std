// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { createExtractor, type Extractor, Parser } from "./create_extractor.ts";
import { parse as parseYAML } from "../yaml/parse.ts";
import { parse as parseTOML } from "../toml/parse.ts";

export const extract: Extractor = createExtractor({
  yaml: parseYAML as Parser,
  toml: parseTOML as Parser,
  json: JSON.parse as Parser,
});
