import { assertEquals } from "../testing/asserts.ts";

import { report } from "https://deno.land/x/seeker@1.0.0-beta-3/mod.ts";

const { circular, orphans } = report(".");

Deno.test("dependency graph inspection - count of circular dependencies", function () {
  assertEquals(circular.length, 0);
});

Deno.test("dependency graph inspection - circular dependencies", function () {
  assertEquals(circular, []);
});

Deno.test("dependency graph inspection - count of orphans", function () {
  assertEquals(orphans.length, 0);
});

Deno.test("dependency graph inspection - orphans", function () {
  assertEquals(orphans, []);
});
