// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { test } from "../testing/mod.ts";
import { Big, DP, RM, NE, PE } from "./big/mod.ts";
import { min } from "./min.ts";

test({
  name: "[math] min",
  fn(): void {
    // reset to default
    Big.DP = DP;
    Big.RM = RM;
    Big.NE = NE;
    Big.PE = PE;
    assertEquals(min([-1, 0, 1, 2, 3, 4]), "-1");
    assertEquals(min(["-2", -1, "0", 1, 2]), "-2");

    assertEquals(min(["-2", -12, "0", 1, 2]), "-12");
    assertEquals(min([1000, 100, 10n]), "10");

    assertThrows((): void => {
      min(["1", "abc"]);
    }, Error);

    assertThrows(
      (): void => {
        min([]);
      },
      Error,
      "Min-array can not be empty."
    );
  }
});
