// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/equals.ts";
import { promptSelect } from "./unstable_prompt_select.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function spyFn<T, K extends keyof T>(
  target: T,
  key: K,
  fn: T[K],
) {
  const originalFn = target[key];
  target[key] = fn;
  return () => target[key] = originalFn;
}

Deno.test("promptSelect() handles enter", () => {
  const expectedOutput = [
    "Please select a browser:\r\n",
    "❯ safari\r\n  chrome\r\n  firefox\r\n",
  ];

  let writeIndex = 0;

  const restoreWriteSync = spyFn(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      assertEquals(output, expectedOutput[writeIndex]);
      writeIndex++;
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    "\r",
  ];

  const restoreReadSync = spyFn(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browser, "safari");

  // Restore mocks
  restoreWriteSync();
  restoreReadSync();
});

Deno.test("promptSelect() handles arrow down", () => {
  const expectedOutput = [
    "Please select a browser:\r\n",
    "❯ safari\r\n  chrome\r\n  firefox\r\n",
    "\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K",
    "  safari\r\n❯ chrome\r\n  firefox\r\n",
    "\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K",
    "  safari\r\n  chrome\r\n❯ firefox\r\n",
  ];

  let writeIndex = 0;

  const restoreWriteSync = spyFn(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      assertEquals(output, expectedOutput[writeIndex]);
      writeIndex++;
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    "\u001B[B",
    "\u001B[B",
    "\r",
  ];

  const restoreReadSync = spyFn(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browser, "firefox");

  // Restore mocks
  restoreWriteSync();
  restoreReadSync();
});

Deno.test("promptSelect() handles arrow up", () => {
  const expectedOutput = [
    "Please select a browser:\r\n",
    "❯ safari\r\n  chrome\r\n  firefox\r\n",
    "\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K",
    "  safari\r\n❯ chrome\r\n  firefox\r\n",
    "\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K",
    "❯ safari\r\n  chrome\r\n  firefox\r\n",
  ];

  let writeIndex = 0;

  const restoreWriteSync = spyFn(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      assertEquals(output, expectedOutput[writeIndex]);
      writeIndex++;
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    "\u001B[B",
    "\u001B[A",
    "\r",
  ];

  const restoreReadSync = spyFn(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browser, "safari");

  // Restore mocks
  restoreWriteSync();
  restoreReadSync();
});

Deno.test("promptSelect() handles up index overflow", () => {
  const expectedOutput = [
    "Please select a browser:\r\n",
    "❯ safari\r\n  chrome\r\n  firefox\r\n",
    "\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K",
    "  safari\r\n  chrome\r\n❯ firefox\r\n",
  ];

  let writeIndex = 0;

  const restoreWriteSync = spyFn(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      assertEquals(output, expectedOutput[writeIndex]);
      writeIndex++;
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    "\u001B[A",
    "\r",
  ];

  const restoreReadSync = spyFn(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browser, "firefox");

  // Restore mocks
  restoreWriteSync();
  restoreReadSync();
});

Deno.test("promptSelect() handles down index overflow", () => {
  const expectedOutput = [
    "Please select a browser:\r\n",
    "❯ safari\r\n  chrome\r\n  firefox\r\n",
    "\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K",
    "  safari\r\n❯ chrome\r\n  firefox\r\n",
    "\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K",
    "  safari\r\n  chrome\r\n❯ firefox\r\n",
    "\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K",
    "❯ safari\r\n  chrome\r\n  firefox\r\n",
  ];

  let writeIndex = 0;

  const restoreWriteSync = spyFn(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      assertEquals(output, expectedOutput[writeIndex]);
      writeIndex++;
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    "\u001B[B",
    "\u001B[B",
    "\u001B[B",
    "\r",
  ];

  const restoreReadSync = spyFn(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browser, "safari");

  // Restore mocks
  restoreWriteSync();
  restoreReadSync();
});

Deno.test("promptSelect() handles clear option", () => {
  const expectedOutput = [
    "Please select a browser:\r\n",
    "❯ safari\r\n  chrome\r\n  firefox\r\n",
    "\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K\x1b[1A\r\x1b[K",
  ];

  let writeIndex = 0;

  const restoreWriteSync = spyFn(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      assertEquals(output, expectedOutput[writeIndex]);
      writeIndex++;
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    "\r",
  ];

  const restoreReadSync = spyFn(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ], { clear: true });

  assertEquals(browser, "safari");

  // Restore mocks
  restoreWriteSync();
  restoreReadSync();
});
