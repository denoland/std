// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert/equals";
import { promptMultipleSelect } from "./unstable_prompt_multiple_select.ts";
import { restore, stub } from "@std/testing/mock";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

Deno.test("promptMultipleSelect() handles enter", () => {
  stub(Deno.stdin, "setRaw");

  const expectedOutput = [
    "Please select browsers:\r\n",
    "❯ ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[3B",
  ];

  const actualOutput: string[] = [];

  stub(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      actualOutput.push(output);
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    "\r",
  ];

  stub(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browsers = promptMultipleSelect("Please select browsers:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browsers, []);
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptMultipleSelect() handles selection", () => {
  stub(Deno.stdin, "setRaw");

  const expectedOutput = [
    "Please select browsers:\r\n",
    "❯ ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[1A",
    "Please select browsers:\r\n",
    "❯ ☑️ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[3B",
  ];

  const actualOutput: string[] = [];

  stub(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      actualOutput.push(output);
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    " ",
    "\r",
  ];

  stub(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browsers = promptMultipleSelect("Please select browsers:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browsers, ["safari"]);
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptMultipleSelect() handles multiple selection", () => {
  stub(Deno.stdin, "setRaw");

  const expectedOutput = [
    "Please select browsers:\r\n",
    "❯ ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[1A",
    "Please select browsers:\r\n",
    "❯ ☑️ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[1A",
    "Please select browsers:\r\n",
    "  ☑️ safari\r\n",
    "❯ ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[2A",

    "\x1b[2A",
    "Please select browsers:\r\n",
    "  ☑️ safari\r\n",
    "❯ ☑️ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[2A",

    "\x1b[2A",
    "Please select browsers:\r\n",
    "  ☑️ safari\r\n",
    "  ☑️ chrome\r\n",
    "❯ ☐ firefox\r\n",
    "\x1b[1A",

    "\x1b[3A",
    "Please select browsers:\r\n",
    "  ☑️ safari\r\n",
    "  ☑️ chrome\r\n",
    "❯ ☑️ firefox\r\n",
    "\x1b[1A",

    "\x1b[1B",
  ];

  const actualOutput: string[] = [];

  stub(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      actualOutput.push(output);
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    " ",
    "\u001B[B",
    " ",
    "\u001B[B",
    " ",
    "\r",
  ];

  stub(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browsers = promptMultipleSelect("Please select browsers:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browsers, ["safari", "chrome", "firefox"]);
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptMultipleSelect() handles arrow down", () => {
  stub(Deno.stdin, "setRaw");

  const expectedOutput = [
    "Please select browsers:\r\n",
    "❯ ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[1A",
    "Please select browsers:\r\n",
    "  ☐ safari\r\n",
    "❯ ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[2A",

    "\x1b[2A",
    "Please select browsers:\r\n",
    "  ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "❯ ☐ firefox\r\n",
    "\x1b[1A",

    "\x1b[3A",
    "Please select browsers:\r\n",
    "  ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "❯ ☑️ firefox\r\n",
    "\x1b[1A",

    "\x1b[1B",
  ];

  const actualOutput: string[] = [];

  stub(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      actualOutput.push(output);
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    "\u001B[B",
    "\u001B[B",
    " ",
    "\r",
  ];

  stub(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browsers = promptMultipleSelect("Please select browsers:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browsers, ["firefox"]);
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptMultipleSelect() handles arrow up", () => {
  stub(Deno.stdin, "setRaw");

  const expectedOutput = [
    "Please select browsers:\r\n",
    "❯ ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[1A",
    "Please select browsers:\r\n",
    "  ☐ safari\r\n",
    "❯ ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[2A",

    "\x1b[2A",
    "Please select browsers:\r\n",
    "❯ ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[1A",
    "Please select browsers:\r\n",
    "❯ ☑️ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[3B",
  ];

  const actualOutput: string[] = [];

  stub(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      actualOutput.push(output);
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    "\u001B[B",
    "\u001B[A",
    " ",
    "\r",
  ];

  stub(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browsers = promptMultipleSelect("Please select browsers:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browsers, ["safari"]);
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptMultipleSelect() handles up index overflow", () => {
  stub(Deno.stdin, "setRaw");

  const expectedOutput = [
    "Please select browsers:\r\n",
    "❯ ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[1A",
    "Please select browsers:\r\n",
    "  ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "❯ ☐ firefox\r\n",
    "\x1b[1A",

    "\x1b[3A",
    "Please select browsers:\r\n",
    "  ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "❯ ☑️ firefox\r\n",
    "\x1b[1A",

    "\x1b[1B",
  ];

  const actualOutput: string[] = [];

  stub(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      actualOutput.push(output);
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    "\u001B[A",
    " ",
    "\r",
  ];

  stub(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browsers = promptMultipleSelect("Please select browsers:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browsers, ["firefox"]);
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptMultipleSelect() handles down index overflow", () => {
  stub(Deno.stdin, "setRaw");

  const expectedOutput = [
    "Please select browsers:\r\n",
    "❯ ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[1A",
    "Please select browsers:\r\n",
    "  ☐ safari\r\n",
    "❯ ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[2A",

    "\x1b[2A",
    "Please select browsers:\r\n",
    "  ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "❯ ☐ firefox\r\n",
    "\x1b[1A",

    "\x1b[3A",
    "Please select browsers:\r\n",
    "❯ ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[1A",
    "Please select browsers:\r\n",
    "❯ ☑️ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[3B",
  ];

  const actualOutput: string[] = [];

  stub(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      actualOutput.push(output);
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    "\u001B[B",
    "\u001B[B",
    "\u001B[B",
    " ",
    "\r",
  ];

  stub(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browsers = promptMultipleSelect("Please select browsers:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browsers, ["safari"]);
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptMultipleSelect() handles clear option", () => {
  stub(Deno.stdin, "setRaw");

  const expectedOutput = [
    "Please select browsers:\r\n",
    "❯ ☐ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[1A",
    "Please select browsers:\r\n",
    "❯ ☑️ safari\r\n",
    "  ☐ chrome\r\n",
    "  ☐ firefox\r\n",
    "\x1b[3A",

    "\x1b[1A",
    "\x1b[J",
  ];

  const actualOutput: string[] = [];

  stub(
    Deno.stdout,
    "writeSync",
    (data: Uint8Array) => {
      const output = decoder.decode(data);
      actualOutput.push(output);
      return data.length;
    },
  );

  let readIndex = 0;

  const inputs = [
    " ",
    "\r",
  ];

  stub(
    Deno.stdin,
    "readSync",
    (data: Uint8Array) => {
      const input = inputs[readIndex++];
      const bytes = encoder.encode(input);
      data.set(bytes);
      return bytes.length;
    },
  );

  const browsers = promptMultipleSelect("Please select browsers:", [
    "safari",
    "chrome",
    "firefox",
  ], { clear: true });

  assertEquals(browsers, ["safari"]);
  assertEquals(expectedOutput, actualOutput);
  restore();
});
