// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  createExtractor,
  Format,
  Parser,
  recognize as _recognize,
  test as _test,
} from "./mod.ts";
export { Format } from "./mod.ts";

export function test(str: string): boolean {
  return _test(str, [Format.JSON]);
}

export function recognize(str: string): Format {
  return _recognize(str, [Format.JSON]);
}

export const extract = createExtractor({ [Format.JSON]: JSON.parse as Parser });
export default extract;
