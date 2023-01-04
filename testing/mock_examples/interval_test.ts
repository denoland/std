// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertSpyCalls, spy } from "../mock.ts";
import { FakeTime } from "../time.ts";
import { secondInterval } from "./interval.ts";

Deno.test("secondInterval calls callback every second and stops after being cleared", () => {
  const time = new FakeTime();
  const cb = spy();

  try {
    const intervalId = secondInterval(cb);
    assertSpyCalls(cb, 0);
    time.tick(500);
    assertSpyCalls(cb, 0);
    time.tick(500);
    assertSpyCalls(cb, 1);
    time.tick(3500);
    assertSpyCalls(cb, 4);

    clearInterval(intervalId);
    time.tick(1000);
    assertSpyCalls(cb, 4);
  } finally {
    time.restore();
  }
});
