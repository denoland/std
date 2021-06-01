import * as perf_hooks from "./perf_hooks.ts";
import { assertEquals } from "../testing/asserts.ts";

Deno.test({
  name: "[perf_hooks] performance",
  fn() {
    assertEquals(perf_hooks.performance, performance);
  },
});

Deno.test({
  name: "[perf_hooks] PerformanceEntry",
  fn() {
    assertEquals(perf_hooks.PerformanceEntry, PerformanceEntry);
  },
});
