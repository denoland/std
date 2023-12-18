// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { joinToString } from "./join_to_string.ts";

Deno.test({
  name: "joinToString() checks no mutation",
  fn() {
    const arr = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    joinToString(arr, (it) => it.name);

    assertEquals(arr, [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ]);
  },
});

Deno.test({
  name: "joinToString() checks identity",
  fn() {
    const arr = ["Kim", "Anna", "Tim"];

    const out = joinToString(arr, (it) => it);

    assertEquals(out, "Kim,Anna,Tim");
  },
});

Deno.test({
  name: "joinToString() checks normal mapppers",
  fn() {
    const arr = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    const out = joinToString(arr, (it) => it.name);

    assertEquals(out, "Kim,Anna,Tim");
  },
});

Deno.test({
  name: "joinToString() checks separator",
  fn() {
    const arr = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    const out = joinToString(arr, (it) => it.name, { separator: " and " });

    assertEquals(out, "Kim and Anna and Tim");
  },
});

Deno.test({
  name: "joinToString() checks prefix",
  fn() {
    const arr = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    const out = joinToString(arr, (it) => it.name, {
      prefix: "winners are: ",
    });

    assertEquals(out, "winners are: Kim,Anna,Tim");
  },
});

Deno.test({
  name: "joinToString() checks suffix",
  fn() {
    const arr = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    const out = joinToString(arr, (it) => it.name, {
      suffix: " are winners",
    });

    assertEquals(out, "Kim,Anna,Tim are winners");
  },
});

Deno.test({
  name: "joinToString() checks limit",
  fn() {
    const arr = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    const out = joinToString(arr, (it) => it.name, {
      limit: 2,
    });

    assertEquals(out, "Kim,Anna,...");
  },
});

Deno.test({
  name: "joinToString() checks truncated",
  fn() {
    const arr = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    const out = joinToString(arr, (it) => it.name, {
      limit: 2,
      truncated: "...!",
    });

    assertEquals(out, "Kim,Anna,...!");
  },
});

Deno.test({
  name: "joinToString() checks all options",
  fn() {
    const arr = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    const out = joinToString(arr, (it) => it.name, {
      suffix: " are winners",
      prefix: "result: ",
      separator: " and ",
      limit: 1,
      truncated: "others",
    });

    assertEquals(out, "result: Kim and others are winners");
  },
});
