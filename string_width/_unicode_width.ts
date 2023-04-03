// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Ported from unicode_width rust crate, Copyright (c) 2015 The Rust Project Developers. MIT license.

import data from "https://deno.land/std@$STD_VERSION/string_width/_data.json" assert {
  type: "json",
};
import { runLengthDecode } from "https://deno.land/std@$STD_VERSION/string_width/_rle.ts";

let tables: Uint8Array[] | null = null;
function lookupWidth(cp: number) {
  if (!tables) tables = data.tables.map(runLengthDecode);

  const t1Offset = tables[0][(cp >> 13) & 0xff];
  const t2Offset = tables[1][128 * t1Offset + ((cp >> 6) & 0x7f)];
  const packedWidths = tables[2][16 * t2Offset + ((cp >> 2) & 0xf)];

  const width = (packedWidths >> (2 * (cp & 0b11))) & 0b11;

  return width === 3 ? 1 : width;
}

const cache = new Map<string, number | null>();
function charWidth(ch: string) {
  if (cache.has(ch)) return cache.get(ch)!;

  const cp = ch.codePointAt(0)!;
  let v: number | null = null;

  if (cp < 0x7f) {
    v = cp >= 0x20 ? 1 : cp === 0 ? 0 : null;
  } else if (cp >= 0xa0) {
    v = lookupWidth(cp);
  } else {
    v = null;
  }

  cache.set(ch, v);
  return v;
}

export function unicodeWidth(str: string) {
  return [...str].map((ch) => charWidth(ch) ?? 0).reduce((a, b) => a + b, 0);
}
