// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { test } from "../testing/mod.ts";
import { Big, DP, RM, NE, PE } from "./big/mod.ts";
import { sum } from "./sum.ts";

test({
  name: "[math] sum",
  fn(): void {
    // reset to default
    Big.DP = DP;
    Big.RM = RM;
    Big.NE = NE;
    Big.PE = PE;
    assertEquals(sum([-1, 0, 1, 2, 3, 4]), "9");
    assertEquals(sum(["-2", -1, "0", 1, 2]), "0");

    assertEquals(sum(["-2", -12, "0", 1, 2]), "-11");
    assertEquals(sum([1000, 100, 10n]), "1110");
    assertEquals(sum([]), "0");

    assertThrows((): void => {
      sum(["1", "abc"]);
    }, Error);
  }
});
