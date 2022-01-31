// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { decode, encode, toASCII, toUnicode, ucs2 } from "./internal/idna.ts";

export { decode, encode, toASCII, toUnicode, ucs2 };

export default {
  decode,
  encode,
  toASCII,
  toUnicode,
  ucs2,
};
