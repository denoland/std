// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { runLengthDecode, runLengthEncode } from "./_rle.ts";
import { assertEquals, assertThrows } from "../assert/mod.ts";

const runLengthTestCases: {
  list: number[];
  compressed: { d: string; r: string };
  testName: string;
}[] = [
  {
    list: [1, 2, 3, 4, 5],
    compressed: { d: "AQIDBAU=", r: "AQEBAQE=" },
    testName: "return expected value if input is normal value",
  },
  {
    list: [1, 1, 1, 1],
    compressed: { d: "AQ==", r: "BA==" },
    testName: "return expected value if input includes an continuous value",
  },
  {
    list: [],
    compressed: { d: "", r: "" },
    testName: "return expected value if input is empty",
  },
];

Deno.test("runLengthEncode()", async (t) => {
  for (const { list, compressed, testName } of runLengthTestCases) {
    await t.step(`runLengthEncode() ${testName}`, () => {
      const encoded = runLengthEncode(list);
      assertEquals(encoded, compressed);
    });
  }

  await t.step(
    `runLengthEncode() throw an error if input is an array containing more than 256 numbers`,
    () => {
      assertThrows(() => runLengthEncode([1, 2, 3, 256]));
    },
  );

  await t.step(
    `runLengthEncode() throw an error if the input is an array longer than 256`,
    () => {
      assertThrows(() =>
        runLengthEncode([...Array.from({ length: 256 }, () => 0)])
      );
    },
  );
});

Deno.test("runLengthDecode()", async (t) => {
  for (const { list, compressed, testName } of runLengthTestCases) {
    await t.step(`runLengthDecode() ${testName}`, () => {
      const decoded = runLengthDecode(compressed);
      assertEquals(decoded, new Uint8Array(list));
    });
  }

  await t.step(`runLengthDecode() throw an error if input is wrong`, () => {
    assertThrows(() => runLengthDecode({ d: "wrong", r: "wrong" }));
  });
});
