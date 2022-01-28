// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { decode, encode, toASCII, toUnicode, ucs2 } from "./internal/idna.ts";
import { emitWarning } from "./process.ts";

emitWarning(
  "The `punycode` module is deprecated. Please use a userland " +
    "alternative instead.",
  "DeprecationWarning",
  "DEP0040",
);

export { decode, encode, toASCII, toUnicode, ucs2 };

export default {
  decode,
  encode,
  toASCII,
  toUnicode,
  ucs2,
};
