// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert/equals";
import { promptSecret } from "./prompt_secret.ts";
import { restore, stub } from "@std/testing/mock";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

Deno.test("promptSecret() handles CR", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Please provide the password: ",
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

  const password = promptSecret("Please provide the password:");
  assertEquals(password, "");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSecret() handles LF", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Please provide the password: ",
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

  const inputs = [
    "\n",
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

  const password = promptSecret("Please provide the password:");
  assertEquals(password, "");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSecret() handles input", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Please provide the password: ",
    "\r\x1b[K",
    "Please provide the password: *",
    "\r\x1b[K",
    "Please provide the password: **",
    "\r\x1b[K",
    "Please provide the password: ***",
    "\r\x1b[K",
    "Please provide the password: ****",
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

  const inputs = [
    "d",
    "e",
    "n",
    "o",
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

  const password = promptSecret("Please provide the password:");

  assertEquals(password, "deno");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSecret() handles DEL", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Please provide the password: ",
    "\r\x1b[K",
    "Please provide the password: *",
    "\r\x1b[K",
    "Please provide the password: ",
    "\r\x1b[K",
    "Please provide the password: *",
    "\r\x1b[K",
    "Please provide the password: **",
    "\r\x1b[K",
    "Please provide the password: ***",
    "\r\x1b[K",
    "Please provide the password: ****",
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

  const inputs = [
    "n",
    "\x7f",
    "d",
    "e",
    "n",
    "o",
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

  const password = promptSecret("Please provide the password:");

  assertEquals(password, "deno");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSecret() handles BS", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Please provide the password: ",
    "\r\x1b[K",
    "Please provide the password: *",
    "\r\x1b[K",
    "Please provide the password: ",
    "\r\x1b[K",
    "Please provide the password: *",
    "\r\x1b[K",
    "Please provide the password: **",
    "\r\x1b[K",
    "Please provide the password: ***",
    "\r\x1b[K",
    "Please provide the password: ****",
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

  const inputs = [
    "n",
    "\b",
    "d",
    "e",
    "n",
    "o",
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

  const password = promptSecret("Please provide the password:");

  assertEquals(password, "deno");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSecret() handles clear option", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Please provide the password: ",
    "\r\x1b[K",
    "Please provide the password: *",
    "\r\x1b[K",
    "Please provide the password: **",
    "\r\x1b[K",
    "Please provide the password: ***",
    "\r\x1b[K",
    "Please provide the password: ****",
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

  const inputs = [
    "d",
    "e",
    "n",
    "o",
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

  const password = promptSecret("Please provide the password:", {
    clear: true,
  });

  assertEquals(password, "deno");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSecret() handles mask option", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Please provide the password: ",
    "\r\x1b[K",
    "Please provide the password: $",
    "\r\x1b[K",
    "Please provide the password: $$",
    "\r\x1b[K",
    "Please provide the password: $$$",
    "\r\x1b[K",
    "Please provide the password: $$$$",
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

  const inputs = [
    "d",
    "e",
    "n",
    "o",
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

  const password = promptSecret("Please provide the password:", { mask: "$" });

  assertEquals(password, "deno");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSecret() handles empty mask option", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Please provide the password: ",
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

  const inputs = [
    "d",
    "e",
    "n",
    "o",
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

  const password = promptSecret("Please provide the password:", { mask: "" });

  assertEquals(password, "deno");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSecret() returns null if Deno.stdin.isTerminal() is false", () => {
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

  const password = promptSecret("Please provide the password:");
  assertEquals(password, null);
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSecret() handles null readSync", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Please provide the password: ",
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

  stub(Deno.stdin, "readSync", () => null);

  const password = promptSecret("Please provide the password:");

  assertEquals(password, "");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSecret() handles empty readSync", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);

  const expectedOutput = [
    "Please provide the password: ",
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

  stub(Deno.stdin, "readSync", () => 0);

  const password = promptSecret("Please provide the password:");

  assertEquals(password, "");
  assertEquals(expectedOutput, actualOutput);
  restore();
});
