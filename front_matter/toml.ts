// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { createExtractor, type Extractor, Parser } from "./create_extractor.ts";
import { parse } from "../toml/parse.ts";

export const extract: Extractor = createExtractor({
  ["toml"]: parse as Parser,
});
