// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { interleave } from "./unstable_interleave.ts";

Deno.test({
  name: "interleave() handles no arguments",
  fn() {
    assertEquals(interleave(), []);
  },
});

Deno.test({
  name: "interleave() handles single array",
  fn() {
    assertEquals(interleave([1, 2, 3]), [1, 2, 3]);
  },
});

Deno.test({
  name: "interleave() handles two equal-length arrays",
  fn() {
    assertEquals(
      interleave([1, 2, 3], ["a", "b", "c"]),
      [1, "a", 2, "b", 3, "c"],
    );
  },
});

Deno.test({
  name: "interleave() handles first array shorter",
  fn() {
    assertEquals(
      interleave([1], ["a", "b", "c"]),
      [1, "a", "b", "c"],
    );
  },
});

Deno.test({
  name: "interleave() handles multiple unequal-length arrays",
  fn() {
    assertEquals(
      interleave([1, 2, 3], ["a", "b"], [true]),
      [1, "a", true, 2, "b", 3],
    );
  },
});

Deno.test({
  name: "interleave() handles empty arrays in input",
  fn() {
    assertEquals(interleave([], [1, 2, 3]), [1, 2, 3]);
    assertEquals(interleave([1, 2], [], [3, 4]), [1, 3, 2, 4]);
    assertEquals(interleave([], [], []), []);
  },
});

Deno.test({
  name: "interleave() handles no mutation",
  fn() {
    const a = [1, 2, 3];
    const b = ["x", "y"];
    interleave(a, b);

    assertEquals(a, [1, 2, 3]);
    assertEquals(b, ["x", "y"]);
  },
});

Deno.test({
  name: "interleave() handles sparse arrays",
  fn() {
    // deno-lint-ignore no-sparse-arrays
    const sparse = [1, , 3];
    assertEquals(
      interleave(sparse, ["a", "b", "c"]),
      [1, "a", undefined, "b", 3, "c"],
    );
  },
});
