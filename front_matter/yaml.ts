// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { createExtractor, Parser } from "./createExtractor.ts";
import { Format } from "./formats.ts";
import { test as _test } from "./test.ts";
import { parse } from "../yaml/parse.ts";

export { Format } from "./formats.ts";

export function test(str: string): boolean {
  return _test(str, [Format.YAML]);
}

export const extract = createExtractor({ [Format.YAML]: parse as Parser });
export default extract;
