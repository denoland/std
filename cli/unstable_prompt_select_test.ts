// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert/equals";
import { promptSelect } from "./unstable_prompt_select.ts";
import { restore, stub } from "@std/testing/mock";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
Deno.test("promptSelect() handles CR", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

  const expectedOutput = [
    "\x1b[?25l",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
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

  const browser = promptSelect("Please select a browser:", [
    { label: "safari", value: 1 },
    { label: "chrome", value: 2 },
    { label: "firefox", value: 3 },
  ]);

  assertEquals(browser, { label: "safari", value: 1 });
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSelect() handles arrow down", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

  const expectedOutput = [
    "\x1b[?25l",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "  safari\r\n",
    "❯ chrome\r\n",
    "  firefox\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "  safari\r\n",
    "  chrome\r\n",
    "❯ firefox\r\n",
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

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browser, "firefox");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSelect() handles arrow up", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

  const expectedOutput = [
    "\x1b[?25l",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "  safari\r\n",
    "❯ chrome\r\n",
    "  firefox\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
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

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browser, "safari");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSelect() handles index underflow", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

  const expectedOutput = [
    "\x1b[?25l",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "  safari\r\n",
    "  chrome\r\n",
    "❯ firefox\r\n",
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

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browser, "firefox");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSelect() handles index overflow", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

  const expectedOutput = [
    "\x1b[?25l",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "  safari\r\n",
    "❯ chrome\r\n",
    "  firefox\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "  safari\r\n",
    "  chrome\r\n",
    "❯ firefox\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
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

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browser, "safari");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSelect() scrolls down and display lines correctly", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

  const expectedOutput = [
    "\x1b[?25l",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
    "  ...\r\n",
    "\x1b[5A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "  safari\r\n",
    "❯ chrome\r\n",
    "  firefox\r\n",
    "  ...\r\n",
    "\x1b[5A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "  safari\r\n",
    "  chrome\r\n",
    "❯ firefox\r\n",
    "  ...\r\n",
    "\x1b[5A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "  ...\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
    "❯ brave\r\n",
    "\x1b[5A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
    "  ...\r\n",
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
    "\u001B[B",
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

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
    "brave",
  ], { visibleLines: 3 });

  assertEquals(browser, "safari");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSelect() uses Deno.consoleSize().rows", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

  const expectedOutput = [
    "\x1b[?25l",
    "Please select a Country:\r\n",
    "❯ Brazil\r\n",
    "  Spain\r\n",
    "  Japan\r\n",
    "  USA\r\n",
    "  Mexico\r\n",
    "  Canada\r\n",
    "  Portugal\r\n",
    "  India\r\n",
    "\x1b[9A",
    "\x1b[J",
    "Please select a Country:\r\n",
    "  Brazil\r\n",
    "❯ Spain\r\n",
    "  Japan\r\n",
    "  USA\r\n",
    "  Mexico\r\n",
    "  Canada\r\n",
    "  Portugal\r\n",
    "  India\r\n",
    "\x1b[9A",
    "\x1b[J",
    "Please select a Country:\r\n",
    "  Brazil\r\n",
    "  Spain\r\n",
    "❯ Japan\r\n",
    "  USA\r\n",
    "  Mexico\r\n",
    "  Canada\r\n",
    "  Portugal\r\n",
    "  India\r\n",
    "\x1b[9A",
    "\x1b[J",
    "Please select a Country:\r\n",
    "  Brazil\r\n",
    "  Spain\r\n",
    "  Japan\r\n",
    "❯ USA\r\n",
    "  Mexico\r\n",
    "  Canada\r\n",
    "  Portugal\r\n",
    "  India\r\n",
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

  const browser = promptSelect("Please select a Country:", [
    "Brazil",
    "Spain",
    "Japan",
    "USA",
    "Mexico",
    "Canada",
    "Portugal",
    "India",
  ]);

  assertEquals(browser, "USA");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSelect() display certain number of visibleLines", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

  const expectedOutput = [
    "\x1b[?25l",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  ...\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "  safari\r\n",
    "❯ chrome\r\n",
    "  ...\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "  ...\r\n",
    "  chrome\r\n",
    "❯ firefox\r\n",
    "  ...\r\n",
    "\x1b[5A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "  ...\r\n",
    "  firefox\r\n",
    "❯ brave\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  ...\r\n",
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
    "\u001B[B",
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

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
    "brave",
  ], { visibleLines: 2 });

  assertEquals(browser, "safari");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSelect() changes the indicator", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

  const expectedOutput = [
    "\x1b[?25l",
    "Please select a browser:\r\n",
    "-> safari\r\n",
    "   chrome\r\n",
    "   firefox\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "   safari\r\n",
    "-> chrome\r\n",
    "   firefox\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "   safari\r\n",
    "   chrome\r\n",
    "-> firefox\r\n",
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

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ], { indicator: "->" });

  assertEquals(browser, "firefox");
  assertEquals(expectedOutput, actualOutput);
  restore();
});
Deno.test("promptSelect() handles clear option", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

  const expectedOutput = [
    "\x1b[?25l",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
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

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ], { clear: true });

  assertEquals(browser, "safari");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSelect() returns null if Deno.stdin.isTerminal() is false", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => false);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

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

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(browser, null);
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSelect() handles ETX", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

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
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
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

  const _browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(called, true);
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSelect() supports search by typing", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => ({ columns: 80, rows: 24 }));

  const expectedOutput = [
    "\x1b[?25l",
    "Please select a browser:\r\n",
    "❯ safari\r\n",
    "  chrome\r\n",
    "  firefox\r\n",
    "\x1b[4A",
    "\x1b[J",
    "Please select a browser: (filter: e)\r\n",
    "❯ chrome\r\n",
    "  firefox\r\n",
    "\x1b[3A",
    "\x1b[J",
    "Please select a browser: (filter: ef)\r\n",
    "❯ firefox\r\n",
    "\x1b[2A",
    "\x1b[J",
    "Please select a browser: (filter: e)\r\n",
    "❯ chrome\r\n",
    "  firefox\r\n",
    "\x1b[3A",
    "\x1b[J",
    "Please select a browser: (filter: e)\r\n",
    "  chrome\r\n",
    "❯ firefox\r\n",
    "\x1b[3A",
    "\x1b[J",
    "Please select a browser:\r\n",
    "❯ safari\r\n", // the selection is reset when the search is changed
    "  chrome\r\n",
    "  firefox\r\n",
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
    "e",
    "f",
    "\u007F", // Backspace
    "\u001B[B", // Arrow down
    "\u007F", // Backspace
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

  const browser = promptSelect("Please select a browser:", [
    "safari",
    "chrome",
    "firefox",
  ]);

  assertEquals(expectedOutput, actualOutput);
  assertEquals(browser, "safari");
  restore();
});
