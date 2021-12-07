// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This file contains test cases which needs to be run at the specific date (2021-12-31)
import { assertEquals } from "../testing/asserts.ts";

Deno.test("The date is 2021-12-31", () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  assertEquals(d, new Date(2021, 12, 31));
});
