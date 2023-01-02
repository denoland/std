// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { createExtractor, Format, Parser, test as _test } from "./mod.ts";
import { parse } from "../yaml.ts";
export { Format } from "./mod.ts";

export function test(str: string): boolean {
  return _test(str, [Format.YAML]);
}

export const extract = createExtractor({ [Format.YAML]: parse as Parser });
export default extract;
