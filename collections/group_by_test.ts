// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { groupBy } from "./group_by.ts";

Deno.test({
  name: "groupBy() groups elements by key function",
  fn() {
    const pets = [
      { type: "dog", name: "Fido" },
      { type: "cat", name: "Whiskers" },
      { type: "dog", name: "Rover" },
    ];
    const grouped = groupBy(pets, (pet) => pet.type);
    assertEquals(grouped, {
      dog: [
        { type: "dog", name: "Fido" },
        { type: "dog", name: "Rover" },
      ],
      cat: [{ type: "cat", name: "Whiskers" }],
    });
  },
});

Deno.test({
  name: "groupBy() handles empty array",
  fn() {
    assertEquals(groupBy([], (x: number) => x % 2), {});
  },
});

Deno.test({
  name: "groupBy() groups numbers by parity",
  fn() {
    const result = groupBy([1, 2, 3, 4, 5, 6], (n) => n % 2 === 0 ? "even" : "odd");
    assertEquals(result, { odd: [1, 3, 5], even: [2, 4, 6] });
  },
});
