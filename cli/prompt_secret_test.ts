// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert/equals";
import { promptSecret } from "./prompt_secret.ts";
import { restore, stub } from "@std/testing/mock";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

Deno.test("promptSecret() handles CR", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => {
    return { columns: 80, rows: 20 };
  });

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
  stub(Deno, "consoleSize", () => {
    return { columns: 80, rows: 20 };
  });

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
  stub(Deno, "consoleSize", () => {
    return { columns: 80, rows: 20 };
  });

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
  stub(Deno, "consoleSize", () => {
    return { columns: 80, rows: 20 };
  });

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
  stub(Deno, "consoleSize", () => {
    return { columns: 80, rows: 20 };
  });

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
  stub(Deno, "consoleSize", () => {
    return { columns: 80, rows: 20 };
  });

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
  stub(Deno, "consoleSize", () => {
    return { columns: 80, rows: 20 };
  });

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
  stub(Deno, "consoleSize", () => {
    return { columns: 80, rows: 20 };
  });

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
  stub(Deno, "consoleSize", () => {
    return { columns: 80, rows: 20 };
  });

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
  stub(Deno, "consoleSize", () => {
    return { columns: 80, rows: 20 };
  });

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

Deno.test("promptSecret() wraps characters wider than console columns", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => {
    return { columns: 5, rows: 20 };
  });

  const expectedOutput = [
    "? ",
    "\r\x1b[K",
    "? *",
    "\r\x1b[K",
    "? **",
    "\r\x1b[K",
    "? ***",
    "*",
    "\r\x1b[K",
    "**",
    "\r\x1b[K",
    "***",
    "\r\x1b[K",
    "****",
    "\r\x1b[K",
    "*****",
    "*",
    "\r\x1b[K",
    "**",
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
    " ",
    "r",
    "u",
    "l",
    "e",
    "s",
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

  const password = promptSecret("?");

  assertEquals(password, "deno rules");
  assertEquals(expectedOutput, actualOutput);
  restore();
});

Deno.test("promptSecret() returns to previous line when deleting characters", () => {
  stub(Deno.stdin, "setRaw");
  stub(Deno.stdin, "isTerminal", () => true);
  stub(Deno, "consoleSize", () => {
    return { columns: 6, rows: 20 };
  });

  const expectedOutput = [
    "? ",
    "\r\u001b[K",
    "? *",
    "\r\u001b[K",
    "? **",
    "\r\u001b[K",
    "? ***",
    "\r\u001b[K",
    "? ****",
    "*",
    "\r\u001b[K",
    "**",
    "\r\u001b[K",
    "***",
    "\r\u001b[K",
    "****",
    "\r\u001b[K",
    "*****",
    "\r\u001b[K",
    "******",
    "*",
    "\r\u001b[K",
    "**",
    "\r\u001b[K",
    "***",
    "\r\u001b[K",
    "**",
    "\r\u001b[K",
    "*",
    "\r\u001b[K",
    "\r\u001b[1F",
    "******",
    "\r\u001b[K",
    "*****",
    "\r\u001b[K",
    "****",
    "\r\u001b[K",
    "***",
    "\r\u001b[K",
    "**",
    "\r\u001b[K",
    "*",
    "\r\u001b[K",
    "\r\u001b[1F",
    "? ****",
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
    " ",
    "r",
    "u",
    "l",
    "e",
    "s",
    "!",
    "!",
    "!",
    "\x7f",
    "\x7f",
    "\x7f",
    "\x7f",
    "\x7f",
    "\x7f",
    "\x7f",
    "\x7f",
    "\x7f",
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

  const password = promptSecret("?");

  assertEquals(password, "deno");
  assertEquals(expectedOutput, actualOutput);
  restore();
});
