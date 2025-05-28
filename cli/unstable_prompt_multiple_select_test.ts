// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert/equals";
import { promptMultipleSelect } from "./unstable_prompt_multiple_select.ts";
import { restore, stub } from "@std/testing/mock";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

Deno.test("promptMultipleSelect() handles enter", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "\x1b[?25l",
    "Please select browsers:\r\n",
    "❯ ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",

    "\x1b[?25h",
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
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "\x1b[?25l",
    "Please select browsers:\r\n",
    "❯ ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "❯ ◉ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",

    "\x1b[?25h",
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
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "\x1b[?25l",
    "Please select browsers:\r\n",
    "❯ ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "❯ ◉ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "  ◉ safari\r\n",
    "❯ ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "  ◉ safari\r\n",
    "❯ ◉ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "  ◉ safari\r\n",
    "  ◉ chrome\r\n",
    "❯ ◯ firefox\r\n",
    "\x1b[4A",

    "Please select browsers:\r\n",
    "  ◉ safari\r\n",
    "  ◉ chrome\r\n",
    "❯ ◉ firefox\r\n",
    "\x1b[?25h",
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
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "\x1b[?25l",
    "Please select browsers:\r\n",
    "❯ ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "  ◯ safari\r\n",
    "❯ ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "  ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "❯ ◯ firefox\r\n",
    "\x1b[4A",

    "Please select browsers:\r\n",
    "  ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "❯ ◉ firefox\r\n",
    "\x1b[?25h",
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
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "\x1b[?25l",
    "Please select browsers:\r\n",
    "❯ ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "  ◯ safari\r\n",
    "❯ ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "❯ ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "❯ ◉ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",

    "\x1b[?25h",
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
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "\x1b[?25l",
    "Please select browsers:\r\n",
    "❯ ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "  ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "❯ ◯ firefox\r\n",
    "\x1b[4A",

    "Please select browsers:\r\n",
    "  ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "❯ ◉ firefox\r\n",
    "\x1b[?25h",
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
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "\x1b[?25l",
    "Please select browsers:\r\n",
    "❯ ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "  ◯ safari\r\n",
    "❯ ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "  ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "❯ ◯ firefox\r\n",
    "\x1b[4A",

    "Please select browsers:\r\n",
    "❯ ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "❯ ◉ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",

    "\x1b[?25h",
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
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "\x1b[?25l",
    "Please select browsers:\r\n",
    "❯ ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "Please select browsers:\r\n",
    "❯ ◉ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[4A",
    "\x1b[J",
    "\x1b[?25h",
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

Deno.test("promptMultipleSelect() handles ETX", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  let called = false;
  stub(
    Deno,
    "exit",
    (() => {
      called = true;
    }) as never,
  );

  const expectedOutput = [
    "\x1b[?25l",
    "Please select browsers:\r\n",
    "❯ ◯ safari\r\n",
    "  ◯ chrome\r\n",
    "  ◯ firefox\r\n",
    "\x1b[?25h",
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
    "\x03",
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

  const _browsers = promptMultipleSelect("Please select browsers:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(called, true);
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptMultipleSelect() returns null if Deno.stdin.isTerminal() is false", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => false);

  const expectedOutput: string[] = [];

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

  const browsers = promptMultipleSelect("Please select browsers:", [
    "safari",
    "chrome",
    "firefox",
  ]);
  assertEquals(browsers, null);
  assertEquals(expectedOutput, actualOutput);
  restore();
});
