// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { createExtractor, Format, Parser, test as _test } from "./mod.ts";
import { parse } from "../toml.ts";

export { Format } from "./mod.ts";

export function test(str: string): boolean {
  return _test(str, [Format.TOML]);
}

export const extract = createExtractor({ [Format.TOML]: parse as Parser });
export default extract;
