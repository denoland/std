// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { repeat } from "./repeat.ts";

Deno.test("repeat()", () => {
  // input / output / count / error message
  const repeatTestCase = [
    ["", "", 0],
    ["", "", 1],
    ["", "", 1.1, "Count must be a non-negative integer"],
    ["", "", 2],
    ["", "", 0],
    ["-", "", 0],
    ["-", "-", -1, "Count must be a non-negative integer"],
    ["-", "----------", 10],
    ["abc ", "abc abc abc ", 3],
  ];
  for (const [input, output, count, errMsg] of repeatTestCase) {
    if (errMsg) {
      assertThrows(
        () => {
          repeat(new TextEncoder().encode(input as string), count as number);
        },
        Error,
        errMsg as string,
      );
    } else {
      const newBytes = repeat(
        new TextEncoder().encode(input as string),
        count as number,
      );

      assertEquals(new TextDecoder().decode(newBytes), output);
    }
  }
});
