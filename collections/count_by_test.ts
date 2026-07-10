// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { countBy } from "./count_by.ts";

Deno.test({
  name: "countBy() counts elements by key",
  fn() {
    const pets = [
      { type: "dog", name: "Fido" },
      { type: "cat", name: "Whiskers" },
      { type: "dog", name: "Rover" },
    ];
    assertEquals(countBy(pets, (pet) => pet.type), { dog: 2, cat: 1 });
  },
});

Deno.test({
  name: "countBy() handles empty array",
  fn() {
    assertEquals(countBy([], (x: number) => x % 2), {});
  },
});

Deno.test({
  name: "countBy() counts numbers by parity",
  fn() {
    assertEquals(
      countBy([1, 2, 3, 4, 5, 6], (n) => n % 2 === 0 ? "even" : "odd"),
      { odd: 3, even: 3 },
    );
  },
});
