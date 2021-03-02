// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { delay } from "./delay.ts";
import { assert } from "../testing/asserts.ts";

Deno.test("[async] delay", async function (): Promise<void> {
  const start = new Date();
  const delayedPromise = delay(100);
  const result = await delayedPromise;
  const diff = new Date().getTime() - start.getTime();
  assert(result === undefined);
  assert(diff >= 100);
});

Deno.test("[async] delay overloding", async () => {
  const objects = [
    {
      run() {
        return "Function";
      },
      time: 1000,
      type: "Function",
    },
    {
      async run() {
        return "Async Function";
      },
      time: 500,
      type: "Async Function",
    },
    { run: Promise.resolve("Resolved"), time: 250, type: "Resolved" },
    { run: "Value", time: 750, type: "Value" },
  ];
  for (const value of objects) {
    const start = new Date();
    const result = await delay(value.time, value.run);
    const diff = new Date().getTime() - start.getTime();
    //@ts-ignore
    assert(result === value.type);
    assert(diff >= value.time);
  }
});
