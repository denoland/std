// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { ProgressBar } from "./unstable_progress_bar.ts";

const decoder = new TextDecoder();

Deno.test("ProgressBar() outputs default result", async () => {
  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar({ writable, max: 10 * 1000 });
  bar.value += 10 * 1000;
  bar.stop().then(() => writable.close());

  const expected = [
    "\r\x1b[K[00:00] [--------------------------------------------------] [0.00/9.77 KiB]",
    "\r\x1b[K[00:00] [##################################################] [9.77/9.77 KiB]",
    "\n",
  ];

  const actual: string[] = [];
  for await (const buffer of readable) {
    actual.push(decoder.decode(buffer));
  }
  assertEquals(actual, expected);
});

Deno.test("ProgressBar() prints every second", async () => {
  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar({ writable, max: 10 * 1000 });
  await new Promise((a) => setTimeout(a, 3000));
  bar.stop().then(() => writable.close());

  const expected = [
    "\r\x1b[K[00:00] [--------------------------------------------------] [0.00/9.77 KiB]",
    "\r\x1b[K[00:01] [--------------------------------------------------] [0.00/9.77 KiB]",
    "\r\x1b[K[00:02] [--------------------------------------------------] [0.00/9.77 KiB]",
    "\r\x1b[K[00:03] [--------------------------------------------------] [0.00/9.77 KiB]",
    "\n",
  ];

  const actual: string[] = [];
  for await (const buffer of readable) {
    actual.push(decoder.decode(buffer));
  }
  assertEquals(actual, expected);
});

Deno.test("ProgressBar() can handle a readable.cancel() correctly", async () => {
  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar({ writable, max: 10 * 1000 });
  bar.stop();
  await readable.cancel();
});

Deno.test("ProgressBar() can remove itself when finished", async () => {
  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar({ writable, max: 10 * 1000, clear: true });
  bar.stop().then(() => writable.close());

  const expected = [
    "\r\x1b[K[00:00] [--------------------------------------------------] [0.00/9.77 KiB]",
    "\r\x1b[K",
  ];

  const actual: string[] = [];
  for await (const buffer of readable) {
    actual.push(decoder.decode(buffer));
  }
  assertEquals(actual, expected);
});

Deno.test("ProgressBar() passes correct values to formatter", async () => {
  const { readable, writable } = new TransformStream();
  let lastTime: undefined | number = undefined;
  let lastValue: undefined | number = undefined;
  let called = false;
  const bar = new ProgressBar({
    writable,
    max: 10 * 1000,
    keepOpen: false,
    fmt(x) {
      called = true;
      if (lastTime != undefined) assertEquals(x.previousTime, lastTime);
      if (lastValue != undefined) assertEquals(x.previousValue, lastValue);
      lastTime = x.time;
      lastValue = x.value;
      return "";
    },
  });

  bar.value += 1000;
  bar.stop();
  assertEquals(called, true);
  await new Response(readable).bytes();
});

Deno.test("ProgressBar() uses correct unit type", async () => {
  const units = ["KiB", "MiB", "GiB", "TiB", "PiB"];
  let i = 0;
  for (const unit of units) {
    const { readable, writable } = new TransformStream();
    const bar = new ProgressBar({
      writable,
      max: 2 ** (10 * ++i),
      keepOpen: false,
    });

    const decoder = new TextDecoder();
    for await (const buffer of readable) {
      assertEquals(decoder.decode(buffer.subarray(-4, -1)), unit);
      break;
    }
    bar.stop();
  }
});

Deno.test("ProgressBar() does not leak resources when immediately stopped", async () => {
  const progressBar = new ProgressBar({ max: 10 });
  await progressBar.stop();
});
