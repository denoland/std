// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { ProgressBar } from "./unstable_progress_bar.ts";
import { FakeTime } from "@std/testing/time";

const decoder = new TextDecoder();

Deno.test("ProgressBar() outputs default result", async () => {
  using fakeTime = new FakeTime();

  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar({ writable, max: 10 * 1000 });
  for (let index = 0; index < 10; index++) {
    bar.value += 1000;
    fakeTime.tick(1000);
  }
  bar.stop().then(() => writable.close());

  const expected = [
    "\r\x1b[K[00:00] [--------------------------------------------------] [0.00/9.77 KiB]",
    "\r\x1b[K[00:01] [#####---------------------------------------------] [0.98/9.77 KiB]",
    "\r\x1b[K[00:02] [##########----------------------------------------] [1.95/9.77 KiB]",
    "\r\x1b[K[00:03] [###############-----------------------------------] [2.93/9.77 KiB]",
    "\r\x1b[K[00:04] [####################------------------------------] [3.91/9.77 KiB]",
    "\r\x1b[K[00:05] [#########################-------------------------] [4.88/9.77 KiB]",
    "\r\x1b[K[00:06] [##############################--------------------] [5.86/9.77 KiB]",
    "\r\x1b[K[00:07] [###################################---------------] [6.84/9.77 KiB]",
    "\r\x1b[K[00:08] [########################################----------] [7.81/9.77 KiB]",
    "\r\x1b[K[00:09] [#############################################-----] [8.79/9.77 KiB]",
    "\r\x1b[K[00:10] [##################################################] [9.77/9.77 KiB]",
    "\r\x1b[K[00:10] [##################################################] [9.77/9.77 KiB]",
    "\n",
  ];

  const actual: string[] = [];
  for await (const buffer of readable) {
    actual.push(decoder.decode(buffer));
  }
  assertEquals(actual, expected);
});

Deno.test("ProgressBar() prints every second", async () => {
  using fakeTime = new FakeTime();
  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar({ writable, max: 10 * 1000 });
  fakeTime.tick(3000);
  bar.stop().then(() => writable.close());

  const expected = [
    "\r\x1b[K[00:00] [--------------------------------------------------] [0.00/9.77 KiB]",
    "\r\x1b[K[00:01] [--------------------------------------------------] [0.00/9.77 KiB]",
    "\r\x1b[K[00:02] [--------------------------------------------------] [0.00/9.77 KiB]",
    "\r\x1b[K[00:03] [--------------------------------------------------] [0.00/9.77 KiB]",
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
  using _fakeTime = new FakeTime();
  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar({ writable, max: 10 * 1000 });
  bar.stop();
  await readable.cancel();
});

Deno.test("ProgressBar() can remove itself when finished", async () => {
  using _fakeTime = new FakeTime();
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
  using _fakeTime = new FakeTime();
  const { readable, writable } = new TransformStream();
  let lastTime: undefined | number = undefined;
  let lastValue: undefined | number = undefined;
  let called = false;
  const bar = new ProgressBar({
    writable,
    max: 10 * 1000,
    keepOpen: false,
    formatter(x) {
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

Deno.test("ProgressBar() handles value < 0", async () => {
  using _fakeTime = new FakeTime();
  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar({ writable, max: 2 ** 10, value: -1 });
  bar.stop().then(() => writable.close());

  const expected = [
    "\r\x1b[K[00:00] [--------------------------------------------------] [-0.00/1.00 KiB]",
    "\r\x1b[K[00:00] [--------------------------------------------------] [-0.00/1.00 KiB]",
    "\n",
  ];

  const actual: string[] = [];
  for await (const buffer of readable) {
    actual.push(decoder.decode(buffer));
  }
  assertEquals(actual, expected);
});

Deno.test("ProgressBar() handles max < 0", async () => {
  using _fakeTime = new FakeTime();
  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar({ writable, max: -1 });
  bar.stop().then(() => writable.close());

  const expected = [
    "\r\x1b[K[00:00] [--------------------------------------------------] [0.00/-0.00 KiB]",
    "\r\x1b[K[00:00] [--------------------------------------------------] [0.00/-0.00 KiB]",
    "\n",
  ];

  const actual: string[] = [];
  for await (const buffer of readable) {
    actual.push(decoder.decode(buffer));
  }
  assertEquals(actual, expected);
});

Deno.test("ProgressBar() handles value > max", async () => {
  using _fakeTime = new FakeTime();
  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar({ writable, max: 2 ** 10, value: 2 ** 10 + 1 });
  bar.stop().then(() => writable.close());

  const expected = [
    "\r\x1b[K[00:00] [##################################################] [1.00/1.00 KiB]",
    "\r\x1b[K[00:00] [##################################################] [1.00/1.00 KiB]",
    "\n",
  ];

  const actual: string[] = [];
  for await (const buffer of readable) {
    actual.push(decoder.decode(buffer));
  }
  assertEquals(actual, expected);
});
