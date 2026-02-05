// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert/equals";
import { promptConfirm, YES_NO_VALUES } from "./unstable_prompt_confirm.ts";
import { restore, stub } from "@std/testing/mock";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

Deno.test("promptConfirm() returns true when user enters 'y'", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Continue? [y$/N$] ",
    "\n",
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
  const inputs = ["y", "\r"];

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

  const result = promptConfirm("Continue?", YES_NO_VALUES);

  assertEquals(result, true);
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() returns false when user enters 'n'", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Continue? [y$/N$] ",
    "\n",
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
  const inputs = ["n", "\r"];

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

  const result = promptConfirm("Continue?", YES_NO_VALUES);

  assertEquals(result, false);
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() returns default false when user presses Enter", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Continue? [y$/N$] ",
    "\n",
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
  const inputs = ["\r"];

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

  const result = promptConfirm("Continue?", YES_NO_VALUES);

  assertEquals(result, false);
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() returns default true when default is set to 'y'", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Continue? [Y$/n$] ",
    "\n",
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
  const inputs = ["\r"];

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

  const result = promptConfirm("Continue?", YES_NO_VALUES, { default: "y" });

  assertEquals(result, true);
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() handles custom values with labels", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Continue? [y (yes)$/N (no)$] ",
    "\n",
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
  const inputs = ["y", "\r"];

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

  const result = promptConfirm("Continue?", [
    { key: "y", label: "yes", value: true },
    { key: "n", label: "no", value: false },
  ]);

  assertEquals(result, true);
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() handles three options", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Save changes? [y (yes)$/n (no)$/C (cancel)$] ",
    "\n",
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
  const inputs = ["y", "\r"];

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

  const result = promptConfirm("Save changes?", [
    { key: "y", label: "yes", value: "save" },
    { key: "n", label: "no", value: "discard" },
    { key: "c", label: "cancel", value: "cancel" },
  ], { default: "c" });

  assertEquals(result, "save");
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() returns third option value", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Continue? [y (yes)$/n (no)$/M (maybe)$] ",
    "\n",
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
  const inputs = ["m", "\r"];

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

  const result = promptConfirm("Continue?", [
    { key: "y", label: "yes", value: "yes" },
    { key: "n", label: "no", value: "no" },
    { key: "m", label: "maybe", value: "maybe" },
  ], { default: "m" });

  assertEquals(result, "maybe");
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() is case insensitive for key", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Continue? [y$/N$] ",
    "\n",
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
  const inputs = ["Y", "\r"];

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

  const result = promptConfirm("Continue?", YES_NO_VALUES);

  assertEquals(result, true);
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() accepts label as input", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Continue? [y (yes)$/N (no)$] ",
    "\n",
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
  const inputs = ["y", "e", "s", "\r"];

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

  const result = promptConfirm("Continue?", [
    { key: "y", label: "yes", value: true },
    { key: "n", label: "no", value: false },
  ]);

  assertEquals(result, true);
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() handles clear option", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Continue? [y$/N$] ",
    "\r\x1b[K",
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
  const inputs = ["y", "\r"];

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

  const result = promptConfirm("Continue?", YES_NO_VALUES, { clear: true });

  assertEquals(result, true);
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() returns null if stdin is not a TTY", () => {
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

  const result = promptConfirm("Continue?", YES_NO_VALUES);

  assertEquals(result, null);
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() returns default on invalid input", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Continue? [y$/N$] ",
    "\n",
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
  const inputs = ["x", "\r"];

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

  const result = promptConfirm("Continue?", YES_NO_VALUES);

  assertEquals(result, false);
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() handles backspace", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Continue? [y$/N$] ",
    "\n",
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
  const inputs = ["n", "\x7f", "y", "\r"]; // n, backspace, y, enter

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

  const result = promptConfirm("Continue?", YES_NO_VALUES);

  assertEquals(result, true);
  assertEquals(actualOutput, expectedOutput);
  restore();
});

Deno.test("promptConfirm() returns default for third option on Enter", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Continue? [y (yes)$/n (no)$/M (maybe)$] ",
    "\n",
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
  const inputs = ["\r"];

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

  const result = promptConfirm("Continue?", [
    { key: "y", label: "yes", value: "yes" },
    { key: "n", label: "no", value: "no" },
    { key: "m", label: "maybe", value: "maybe" },
  ], { default: "m" });

  assertEquals(result, "maybe");
  assertEquals(actualOutput, expectedOutput);
  restore();
});
