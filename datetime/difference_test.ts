// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { difference } from "./difference.ts";

Deno.test({
  name: "difference()",
  fn() {
    const denoInit = new Date("2018/5/14");
    const denoReleaseV1 = new Date("2020/5/13");

    // The order of the dates does not matter
    assertEquals(
      difference(denoInit, denoReleaseV1),
      difference(denoReleaseV1, denoInit),
    );

    let diff = difference(denoReleaseV1, denoInit, {
      units: ["days", "weeks", "months", "years", "quarters"],
    });
    assertEquals(diff.days, 730);
    assertEquals(diff.weeks, 104);
    assertEquals(diff.months, 23);
    assertEquals(diff.quarters, 7);
    assertEquals(diff.years, 1);

    // test for 'months' potential null-state when calculating quarters only
    diff = difference(denoInit, denoReleaseV1, {
      units: ["quarters"],
    });
    assertEquals(diff.quarters, 7);

    // Default units
    diff = difference(denoReleaseV1, denoInit);
    assertEquals(diff.days, 730);
    assertEquals(diff.weeks, 104);
    assertEquals(diff.months, 23);
    assertEquals(diff.quarters, 7);
    assertEquals(diff.years, 1);

    // If `options.units.months` isn't defined
    diff = difference(denoReleaseV1, denoInit, {
      units: ["years", "quarters"],
    });
    assertEquals(diff.quarters, 7);
    assertEquals(diff.years, 1);

    const birth = new Date("1998/2/23 10:10:10");
    const old = new Date("1998/2/23 11:11:11");
    diff = difference(birth, old, {
      units: ["milliseconds", "minutes", "seconds", "hours"],
    });
    assertEquals(diff.milliseconds, 3661000);
    assertEquals(diff.seconds, 3661);
    assertEquals(diff.minutes, 61);
    assertEquals(diff.hours, 1);
  },
});
