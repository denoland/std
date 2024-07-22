// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { copy } from "./copy.ts";
import { assertEquals } from "@std/assert";

const SRC_PATH = "./io/testdata/copy-src.txt";
const DST_PATH = "./io/testdata/copy-dst.txt";

Deno.test("copy()", async () => {
  try {
    using srcFile = await Deno.open(SRC_PATH);
    using dstFile = await Deno.open(DST_PATH, {
      create: true,
      write: true,
    });
    await copy(srcFile, dstFile);
    const srcOutput = await Deno.readFile(SRC_PATH);
    const dstOutput = await Deno.readFile(DST_PATH);
    assertEquals(srcOutput, dstOutput);
  } finally {
    await Deno.remove(DST_PATH);
  }
});
