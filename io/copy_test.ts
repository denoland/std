// Copyright 2018-2026 the Deno authors. MIT license.
import { copy } from "./copy.ts";
import { assertEquals, assertStrictEquals } from "@std/assert";

const SRC_PATH = "./io/testdata/copy-src.txt";
const DST_PATH = "./io/testdata/copy-dst.txt";

Deno.test("copy()", async (t) => {
  try {
    using srcFile = await Deno.open(SRC_PATH);
    using dstFile = await Deno.open(DST_PATH, {
      create: true,
      write: true,
    });

    const actualByteCount = await copy(srcFile, dstFile);

    await t.step(
      "number of copied bytes equals source size",
      async () => {
        const fileInfo = await srcFile.stat();
        const expectedByteCount = fileInfo.size;
        assertStrictEquals(actualByteCount, expectedByteCount);
      },
    );

    await t.step(
      "source and destination bytes are equal",
      async () => {
        const srcOutput = await Deno.readFile(SRC_PATH);
        const dstOutput = await Deno.readFile(DST_PATH);
        assertEquals(srcOutput, dstOutput);
      },
    );
  } finally {
    await Deno.remove(DST_PATH);
  }
});
