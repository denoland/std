// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { createExtractor, Parser } from "./createExtractor.ts";
import { Format } from "./formats.ts";
import { test as _test } from "./test.ts";

export { Format } from "./formats.ts";

export function test(str: string): boolean {
  return _test(str, [Format.JSON]);
}

export const extract = createExtractor({ [Format.JSON]: JSON.parse as Parser });
export default extract;
