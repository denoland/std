// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { associateWith } from "./associate_with.ts";

function associateWithTest<T>(
  input: [readonly string[], (el: string) => T],
  expected: { [x: string]: T },
  message?: string,
) {
  const actual = associateWith(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "associateWith() handles no mutation",
  fn() {
    const arrayA = ["Foo", "Bar"];
    associateWith(arrayA, (it) => it.charAt(0));

    assertEquals(arrayA, ["Foo", "Bar"]);
  },
});

Deno.test({
  name: "associateWith() handles empty input",
  fn() {
    associateWithTest([[], () => "abc"], {});
  },
});

Deno.test({
  name: "associateWith() handles associates",
  fn() {
    associateWithTest<number>(
      [
        [
          "Kim",
          "Lara",
          "Jonathan",
        ],
        (it) => it.length,
      ],
      {
        "Kim": 3,
        "Lara": 4,
        "Jonathan": 8,
      },
    );
    associateWithTest(
      [
        [
          "Kim@example.org",
          "Lara@example.org",
          "Jonathan@example.org",
        ],
        (it) => it.replace("org", "com"),
      ],
      {
        "Kim@example.org": "Kim@example.com",
        "Lara@example.org": "Lara@example.com",
        "Jonathan@example.org": "Jonathan@example.com",
      },
    );
    associateWithTest<boolean>(
      [
        [
          "Kim",
          "Lara",
          "Jonathan",
        ],
        (it) => /m/.test(it),
      ],
      {
        "Kim": true,
        "Lara": false,
        "Jonathan": false,
      },
    );
  },
});

Deno.test({
  name: "associateWith() handles duplicate keys",
  fn() {
    associateWithTest(
      [
        ["Kim", "Marija", "Karl", "Jonathan", "Marija"],
        (it) => it.charAt(0),
      ],
      {
        "Jonathan": "J",
        "Karl": "K",
        "Kim": "K",
        "Marija": "M",
      },
    );
  },
});
