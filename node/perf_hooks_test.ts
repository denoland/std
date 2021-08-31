import * as perfHooks from "./perf_hooks.ts";
import { assertEquals } from "../testing/asserts.ts";

Deno.test({
  name: "[perf_hooks] performance",
  fn() {
    assertEquals(perfHooks.performance.clearMarks, performance.clearMarks);
    assertEquals(perfHooks.performance.mark, performance.mark);
    assertEquals(perfHooks.performance.now, performance.now);
  },
});

Deno.test({
  name: "[perf_hooks] PerformanceEntry",
  fn() {
    assertEquals(perfHooks.PerformanceEntry, PerformanceEntry);
  },
});
