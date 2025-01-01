// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { ascend, descend } from "./comparators.ts";

Deno.test("ascend() works as expected", () => {
  assertEquals(ascend(2, 2), 0);
  assertEquals(ascend(2, 3), -1);
  assertEquals(ascend(3, 2), 1);
  assertEquals(ascend("b", "b"), 0);
  assertEquals(ascend("a", "b"), -1);
  assertEquals(ascend("b", "a"), 1);
  assertEquals(ascend("b", "b0"), -1);
  assertEquals(ascend("b0", "b"), 1);
  assertEquals(ascend("2020-05-20", "2020-05-20"), 0);
  assertEquals(ascend("2020-05-19", "2020-05-20"), -1);
  assertEquals(ascend("2020-05-20", "2020-05-19"), 1);
  assertEquals(ascend(new Date("2020-05-20"), new Date("2020-05-20")), 0);
  assertEquals(ascend(new Date("2020-05-19"), new Date("2020-05-20")), -1);
  assertEquals(ascend(new Date("2020-05-20"), new Date("2020-05-19")), 1);
  assertEquals(ascend<string | number>(-10, "-10"), 0);
  assertEquals(ascend<string | number>("-10", -10), 0);
  assertEquals(ascend<string | number>(-9, "-10"), 1);
  assertEquals(ascend<string | number>("-9", -10), 1);
  assertEquals(ascend<string | number>(-10, "-9"), -1);
  assertEquals(ascend<string | number>("-10", -9), -1);
});

Deno.test("descend() works as expected", () => {
  assertEquals(descend(2, 2), 0);
  assertEquals(descend(2, 3), 1);
  assertEquals(descend(3, 2), -1);
  assertEquals(descend("b", "b"), 0);
  assertEquals(descend("a", "b"), 1);
  assertEquals(descend("b", "a"), -1);
  assertEquals(descend("b", "b0"), 1);
  assertEquals(descend("b0", "b"), -1);
  assertEquals(descend("2020-05-20", "2020-05-20"), 0);
  assertEquals(descend("2020-05-19", "2020-05-20"), 1);
  assertEquals(descend("2020-05-20", "2020-05-19"), -1);
  assertEquals(descend(new Date("2020-05-20"), new Date("2020-05-20")), 0);
  assertEquals(descend(new Date("2020-05-19"), new Date("2020-05-20")), 1);
  assertEquals(descend(new Date("2020-05-20"), new Date("2020-05-19")), -1);
  assertEquals(descend<string | number>(-10, "-10"), 0);
  assertEquals(descend<string | number>("-10", -10), 0);
  assertEquals(descend<string | number>(-9, "-10"), -1);
  assertEquals(descend<string | number>("-9", -10), -1);
  assertEquals(descend<string | number>(-10, "-9"), 1);
  assertEquals(descend<string | number>("-10", -9), 1);
});
