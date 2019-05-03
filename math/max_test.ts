// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { test } from "../testing/mod.ts";
import { Big, DP, RM, NE, PE } from "./big/mod.ts";
import { max } from "./max.ts";

test({
  name: "[math] max",
  fn(): void {
    // reset to default
    Big.DP = DP;
    Big.RM = RM;
    Big.NE = NE;
    Big.PE = PE;
    assertEquals(max([-1, 0, 1, 2, 3, 4]), "4");
    assertEquals(max(["-2", -1, "0", 1, 2]), "2");

    assertEquals(max(["-2", -12, "0", 1, 2]), "2");
    assertEquals(max([1000, 100, 10n]), "1000");

    assertThrows((): void => {
      max(["1", "abc"]);
    }, Error);

    assertThrows(
      (): void => {
        max([]);
      },
      Error,
      "Max-array can not be empty."
    );
  }
});
