// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { createExtractor, type Extractor, Parser } from "./create_extractor.ts";
import { parse } from "../yaml/parse.ts";

export const extract: Extractor = createExtractor({
  ["yaml"]: parse as Parser,
});
