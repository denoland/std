// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { calcLastPage, calcPageNum } from "./pagination.ts";
import { assertEquals } from "std/testing/asserts.ts";

Deno.test("[pagination] calcPageNum()", () => {
  assertEquals(calcPageNum(new URL("https://saaskit.deno.dev/")), 1);
  assertEquals(calcPageNum(new URL("https://saaskit.deno.dev/?page=2")), 2);
  assertEquals(
    calcPageNum(new URL("https://saaskit.deno.dev/?time-ago=month")),
    1,
  );
  assertEquals(
    calcPageNum(new URL("https://saaskit.deno.dev/?time-ago=month&page=3")),
    3,
  );
});

Deno.test("[pagination] calcLastPage()", () => {
  assertEquals(calcLastPage(1, 10), 1);
  assertEquals(calcLastPage(15, 10), 2);
  assertEquals(calcLastPage(11, 20), 1);
  assertEquals(calcLastPage(50, 20), 3);
});
