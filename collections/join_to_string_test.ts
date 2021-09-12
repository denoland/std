// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { joinToString } from "./join_to_string.ts";

Deno.test({
  name: "[collections/joinToString] no mutation",
  fn() {
    const array = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    joinToString(array, (it) => it.name);

    assertEquals(array, [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ]);
  },
});

Deno.test({
  name: "[collections/joinToString] identity",
  fn() {
    const array = ["Kim", "Anna", "Tim"];

    const out = joinToString(array, (it) => it);

    assertEquals(out, "Kim, Anna, Tim");
  },
});

Deno.test({
  name: "[collections/joinToString] normal mapppers",
  fn() {
    const array = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    const out = joinToString(array, (it) => it.name);

    assertEquals(out, "Kim, Anna, Tim");
  },
});

Deno.test({
  name: "[collections/joinToString] separator",
  fn() {
    const array = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    const out = joinToString(array, (it) => it.name, { separator: " and " });

    assertEquals(out, "Kim and Anna and Tim");
  },
});

Deno.test({
  name: "[collections/joinToString] prefix",
  fn() {
    const array = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    const out = joinToString(array, (it) => it.name, {
      prefix: "winners are: ",
    });

    assertEquals(out, "winners are: Kim, Anna, Tim");
  },
});

Deno.test({
  name: "[collections/joinToString] suffix",
  fn() {
    const array = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    const out = joinToString(array, (it) => it.name, {
      suffix: " are winners",
    });

    assertEquals(out, "Kim, Anna, Tim are winners");
  },
});

Deno.test({
  name: "[collections/joinToString] all options",
  fn() {
    const array = [
      { name: "Kim", age: 22 },
      { name: "Anna", age: 31 },
      { name: "Tim", age: 58 },
    ];
    const out = joinToString(array, (it) => it.name, {
      suffix: " are winners",
      prefix: "result ",
      separator: " and ",
    });

    assertEquals(out, "Kim, Anna, Tim are winners");
  },
});
