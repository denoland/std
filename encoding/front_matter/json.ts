// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { createExtractor, Format, Parser, test as _test } from "./mod.ts";
export { Format } from "./mod.ts";

export function test(str: string): boolean {
  return _test(str, [Format.JSON]);
}

export const extract = createExtractor({ [Format.JSON]: JSON.parse as Parser });
export default extract;
