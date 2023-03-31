#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
import { fromFileUrl } from "https://deno.land/std@$STD_VERSION/path/mod.ts";
import * as toml from "https://deno.land/std@$STD_VERSION/toml/mod.ts";

// To update for parity with a new version of unicode-width crate, bump the
// version number here, re-run this script to update the data, run
// `cargo build` from `string_width/testdata/unicode_width_crate`, and then
// re-run the tests.
const CRATE_VERSION = "0.1.10";

const rs = await (await fetch(
  `https://raw.githubusercontent.com/unicode-rs/unicode-width/v${CRATE_VERSION}/src/tables.rs`,
)).text();

function runLengthEncode(arr: number[]) {
  const data: number[] = [];
  const runLengths: number[] = [];

  let prev: symbol | number = Symbol("none");

  for (const x of arr) {
    if (x === prev) {
      ++runLengths[runLengths.length - 1];
    } else {
      prev = x;
      data.push(x);
      runLengths.push(1);
    }
  }

  return {
    d: btoa(String.fromCharCode(...data)),
    r: btoa(String.fromCharCode(...runLengths)),
  };
}

const data = {
  CRATE_VERSION,
  UNICODE_VERSION: rs
    .match(
      /pub const UNICODE_VERSION: \(u8, u8, u8\) = \((\d+), (\d+), (\d+)\);/,
    )!
    .slice(1)
    .join("."),
  tables: [] as ReturnType<typeof runLengthEncode>[],
};

for (
  const [/* full match */, n, len, content] of [
    ...rs.matchAll(
      /static TABLES_(\d): \[u8; (\d+)\] = \[([^\]]*)\]/g,
    ),
  ]
) {
  const table = [...content.matchAll(/\w+/g)].flatMap(Number);
  assertEquals(table.length, Number(len));

  data.tables[Number(n)] = runLengthEncode(table);
}

assertEquals(data.UNICODE_VERSION.split(".").length, 3);
assertEquals(data.tables.length, 3);

const cargoPath = fromFileUrl(
  import.meta.resolve(
    "https://deno.land/std@$STD_VERSION/string_width/testdata/unicode_width_crate/Cargo.toml",
  ),
);
const cargo = toml.parse(await Deno.readTextFile(cargoPath)) as {
  dependencies: Record<string, string>;
};
cargo.dependencies["unicode-width"] = CRATE_VERSION;

await Deno.writeTextFile(cargoPath, toml.stringify(cargo).trimStart());

await Deno.writeTextFile(
  fromFileUrl(
    import.meta.resolve(
      "https://deno.land/std@$STD_VERSION/string_width/_data.json",
    ),
  ),
  JSON.stringify(data, null, 2) + "\n",
);
