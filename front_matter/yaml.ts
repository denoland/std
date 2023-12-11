// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { createExtractor, Parser } from "./create_extractor.ts";
import { Format } from "./_formats.ts";
import { test as _test } from "./test.ts";
import { parse } from "../yaml/parse.ts";

export { Format } from "./_formats.ts";

export const extract = createExtractor({ [Format.YAML]: parse as Parser });
