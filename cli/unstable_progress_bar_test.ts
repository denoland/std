// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { ProgressBar } from "./unstable_progress_bar.ts";

async function* getData(
  loops: number,
  bufferSize: number,
): AsyncGenerator<Uint8Array> {
  for (let i = 0; i < loops; ++i) {
    yield new Uint8Array(bufferSize);
    await new Promise((a) => setTimeout(a, Math.random() * 100));
  }
}

const decoder = new TextDecoder();

Deno.test("ProgressBar() outputs default result", async () => {
  const { readable, writable } = new TransformStream();

  const bar = new ProgressBar({ writable, max: 10 * 1000 });
  for (let index = 0; index < 10; index++) {
    bar.value += 1000;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  bar.stop().then(() => writable.close());

  const expected = [
    "\r\u001b[K[00:00] [--------------------------------------------------] [0.00/9.77 KiB] ",
    "\r\u001b[K[00:00] [#####---------------------------------------------] [0.98/9.77 KiB] ",
    "\r\u001b[K[00:00] [##########----------------------------------------] [1.95/9.77 KiB] ",
    "\r\u001b[K[00:00] [###############-----------------------------------] [2.93/9.77 KiB] ",
    "\r\u001b[K[00:00] [####################------------------------------] [3.91/9.77 KiB] ",
    "\r\u001b[K[00:00] [#########################-------------------------] [4.88/9.77 KiB] ",
    "\r\u001b[K[00:00] [##############################--------------------] [5.86/9.77 KiB] ",
    "\r\u001b[K[00:00] [###################################---------------] [6.84/9.77 KiB] ",
    "\r\u001b[K[00:00] [########################################----------] [7.81/9.77 KiB] ",
    "\r\u001b[K[00:00] [#############################################-----] [8.79/9.77 KiB] ",
    "\r\u001b[K[00:01] [##################################################] [9.77/9.77 KiB] ",
    "\n",
  ];

  const actual = [];
  for await (const buffer of readable) {
    actual.push(decoder.decode(buffer));
  }
  assertEquals(actual, expected);
});

Deno.test("ProgressBar() outputs passing time", async () => {
  const { readable, writable } = new TransformStream();

  const bar = new ProgressBar({ writable, max: 10 * 1000 });
  await new Promise((resolve) => setTimeout(resolve, 3000));
  bar.stop().then(() => writable.close());

  const expected = [
    "\r\u001b[K[00:00] [--------------------------------------------------] [0.00/9.77 KiB] ",
    "\r\u001b[K[00:01] [--------------------------------------------------] [0.00/9.77 KiB] ",
    "\r\u001b[K[00:02] [--------------------------------------------------] [0.00/9.77 KiB] ",
    "\n",
  ];

  const actual = [];
  for await (const buffer of readable) {
    actual.push(decoder.decode(buffer));
  }
  assertEquals(actual, expected);
});

Deno.test("ProgressBar() change max", async () => {
  const { readable, writable } = new TransformStream();

  const bar = new ProgressBar({ writable, max: 2 ** 10 });
  bar.max = 2 ** 20;
  await new Promise((resolve) => setTimeout(resolve, 100));
  bar.stop().then(() => writable.close());

  const expected = [
    "\r\u001b[K[00:00] [--------------------------------------------------] [0.00/1.00 KiB] ",
    "\r\u001b[K[00:00] [--------------------------------------------------] [0.00/1.00 MiB] ",
    "\n",
  ];

  let index = 0;
  for await (const buffer of readable) {
    const actual = decoder.decode(buffer);
    assertEquals(actual, expected[index++]);
  }
});

Deno.test("ProgressBar() can handle a readable.cancel() correctly", async () => {
  const { readable, writable } = new TransformStream();

  const bar = new ProgressBar({ writable, max: 10 * 1000 });
  for (let index = 0; index < 10; index++) {
    bar.value += 1000;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  bar.stop();
  await readable.cancel();
});

Deno.test("ProgressBar() can remove itself when finished", async () => {
  const { readable, writable } = new TransformStream();

  const bar = new ProgressBar({ writable, max: 10 * 1000, clear: true });
  for (let index = 0; index < 10; index++) {
    bar.value += 1000;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  bar.stop().then(() => writable.close());

  const expected = [
    "\r\u001b[K[00:00] [--------------------------------------------------] [0.00/9.77 KiB] ",
    "\r\u001b[K[00:00] [#####---------------------------------------------] [0.98/9.77 KiB] ",
    "\r\u001b[K[00:00] [##########----------------------------------------] [1.95/9.77 KiB] ",
    "\r\u001b[K[00:00] [###############-----------------------------------] [2.93/9.77 KiB] ",
    "\r\u001b[K[00:00] [####################------------------------------] [3.91/9.77 KiB] ",
    "\r\u001b[K[00:00] [#########################-------------------------] [4.88/9.77 KiB] ",
    "\r\u001b[K[00:00] [##############################--------------------] [5.86/9.77 KiB] ",
    "\r\u001b[K[00:00] [###################################---------------] [6.84/9.77 KiB] ",
    "\r\u001b[K[00:00] [########################################----------] [7.81/9.77 KiB] ",
    "\r\u001b[K[00:00] [#############################################-----] [8.79/9.77 KiB] ",
    "\r\u001b[K[00:01] [##################################################] [9.77/9.77 KiB] ",
    "\r\x1b[K",
  ];

  const actual = [];
  for await (const buffer of readable) {
    actual.push(decoder.decode(buffer));
  }
  assertEquals(actual, expected);
});

Deno.test("ProgressBar() passes correct values to formatter", async () => {
  const { readable, writable } = new TransformStream();
  let lastTime: undefined | number = undefined;
  let lastValue: undefined | number = undefined;
  const bar = new ProgressBar({
    writable,
    max: 10 * 1000,
    keepOpen: false,
    fmt(x) {
      if (lastTime != undefined) assertEquals(x.previousTime, lastTime);
      if (lastValue != undefined) assertEquals(x.previousValue, lastValue);
      lastTime = x.time;
      lastValue = x.value;
      return "";
    },
  });

  for await (const a of getData(10, 1000)) bar.value += a.length;
  bar.stop();

  await new Response(readable).bytes();
});

Deno.test("ProgressBar() uses correct unit type", async (t) => {
  await t.step("KiB", async () => {
    const expected =
      "\r\x1b[K[00:00] [--------------------------------------------------] [0.00/1.00 KiB] ";
    const { readable, writable } = new TransformStream();
    const bar = new ProgressBar({
      writable,
      max: 2 ** 10,
      keepOpen: false,
    });
    for await (const buffer of readable) {
      const actual = decoder.decode(buffer);
      assertEquals(actual, expected);
      break;
    }
    bar.stop();
  });
  await t.step("MiB", async () => {
    const expected =
      "\r\x1b[K[00:00] [--------------------------------------------------] [0.00/1.00 MiB] ";
    const { readable, writable } = new TransformStream();
    const bar = new ProgressBar({
      writable,
      max: 2 ** 20,
      keepOpen: false,
    });
    for await (const buffer of readable) {
      const actual = decoder.decode(buffer);
      assertEquals(actual, expected);
      break;
    }
    bar.stop();
  });
  await t.step("GiB", async () => {
    const expected =
      "\r\x1b[K[00:00] [--------------------------------------------------] [0.00/1.00 GiB] ";
    const { readable, writable } = new TransformStream();
    const bar = new ProgressBar({
      writable,
      max: 2 ** 30,
      keepOpen: false,
    });
    for await (const buffer of readable) {
      const actual = decoder.decode(buffer);
      assertEquals(actual, expected);
      break;
    }
    bar.stop();
  });
  await t.step("TiB", async () => {
    const expected =
      "\r\x1b[K[00:00] [--------------------------------------------------] [0.00/1.00 TiB] ";
    const { readable, writable } = new TransformStream();
    const bar = new ProgressBar({
      writable,
      max: 2 ** 40,
      keepOpen: false,
    });
    for await (const buffer of readable) {
      const actual = decoder.decode(buffer);
      assertEquals(actual, expected);
      break;
    }
    bar.stop();
  });
  await t.step("PiB", async () => {
    const expected =
      "\r\x1b[K[00:00] [--------------------------------------------------] [0.00/1.00 PiB] ";
    const { readable, writable } = new TransformStream();
    const bar = new ProgressBar({
      writable,
      max: 2 ** 50,
      keepOpen: false,
    });
    for await (const buffer of readable) {
      const actual = decoder.decode(buffer);
      assertEquals(actual, expected);
      break;
    }
    bar.stop();
  });
});

Deno.test("ProgressBar() does not leak resources when immediately stopped", async () => {
  const progressBar = new ProgressBar({ max: 10 });
  await progressBar.stop();
});
