// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { runLengthDecode, runLengthEncode } from "./_rle.ts";
import { assertEquals, assertThrows } from "../assert/mod.ts";

const runLengthTestCases: [number[], { d: string; r: string }, string][] = [
  [
    [1, 2, 3, 4, 5],
    { d: "AQIDBAU=", r: "AQEBAQE=" },
    "return expected value if input is normal value",
  ],
  [
    [1, 1, 1, 1],
    { d: "AQ==", r: "BA==" },
    "return expected value if input includes an continuous value",
  ],
  [
    [],
    { d: "", r: "" },
    "return expected value if input is empty",
  ],
];

Deno.test("runLengthEncode()", async (t) => {
  for (const [list, compressed, testName] of runLengthTestCases) {
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
  for (const [list, compressed, testName] of runLengthTestCases) {
    await t.step(`runLengthDecode() ${testName}`, () => {
      const decoded = runLengthDecode(compressed);
      assertEquals(decoded, new Uint8Array(list));
    });
  }

  await t.step(`runLengthDecode() throw an error if input is wrong`, () => {
    assertThrows(() => runLengthDecode({ d: "wrong", r: "wrong" }));
  });
});
