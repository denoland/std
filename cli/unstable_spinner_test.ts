// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { Spinner } from "./unstable_spinner.ts";
import { restore, stub } from "@std/testing/mock";
import { FakeTime } from "@std/testing/time";

const decoder = new TextDecoder();

Deno.test("Spinner can start and stop", async () => {
  try {
    const expectedOutput = [
      "\r\x1b[K⠋\x1b[0m Loading...",
      "\r\x1b[K⠙\x1b[0m Loading...",
      "\r\x1b[K⠹\x1b[0m Loading...",
      "\r\x1b[K⠸\x1b[0m Loading...",
      "\r\x1b[K⠼\x1b[0m Loading...",
      "\r\x1b[K⠴\x1b[0m Loading...",
      "\r\x1b[K⠦\x1b[0m Loading...",
      "\r\x1b[K⠧\x1b[0m Loading...",
      "\r\x1b[K⠇\x1b[0m Loading...",
      "\r\x1b[K⠏\x1b[0m Loading...",
      "\r\x1b[K",
    ];

    const actualOutput: string[] = [];

    let resolvePromise: (value: void | PromiseLike<void>) => void;
    const promise = new Promise<void>((resolve) => resolvePromise = resolve);

    stub(
      Deno.stdout,
      "writeSync",
      (data: Uint8Array) => {
        const output = decoder.decode(data);
        actualOutput.push(output);
        if (actualOutput.length === expectedOutput.length - 1) resolvePromise();
        return data.length;
      },
    );

    const spinner = new Spinner({ message: "Loading..." });
    spinner.start();
    await promise;
    spinner.stop();
    assertEquals(actualOutput, expectedOutput);
  } finally {
    restore();
  }
});

Deno.test("Spinner constructor accepts spinner", async () => {
  try {
    const expectedOutput = [
      "\r\x1b[K0\x1b[0m ",
      "\r\x1b[K1\x1b[0m ",
      "\r\x1b[K2\x1b[0m ",
      "\r\x1b[K3\x1b[0m ",
      "\r\x1b[K4\x1b[0m ",
      "\r\x1b[K5\x1b[0m ",
      "\r\x1b[K6\x1b[0m ",
      "\r\x1b[K7\x1b[0m ",
      "\r\x1b[K8\x1b[0m ",
      "\r\x1b[K9\x1b[0m ",
      "\r\x1b[K",
    ];

    const actualOutput: string[] = [];

    let resolvePromise: (value: void | PromiseLike<void>) => void;
    const promise = new Promise<void>((resolve) => resolvePromise = resolve);

    stub(
      Deno.stdout,
      "writeSync",
      (data: Uint8Array) => {
        const output = decoder.decode(data);
        actualOutput.push(output);
        if (actualOutput.length === expectedOutput.length - 1) resolvePromise();
        return data.length;
      },
    );

    const spinner = new Spinner({
      spinner: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    });
    spinner.start();
    await promise;
    spinner.stop();
    assertEquals(actualOutput, expectedOutput);
  } finally {
    restore();
  }
});

Deno.test("Spinner constructor accepts message", async () => {
  try {
    const expectedOutput = [
      "\r\x1b[K⠋\x1b[0m Spinning with Deno 🦕",
      "\r\x1b[K⠙\x1b[0m Spinning with Deno 🦕",
      "\r\x1b[K⠹\x1b[0m Spinning with Deno 🦕",
      "\r\x1b[K",
    ];

    const actualOutput: string[] = [];

    let resolvePromise: (value: void | PromiseLike<void>) => void;
    const promise = new Promise<void>((resolve) => resolvePromise = resolve);

    stub(
      Deno.stdout,
      "writeSync",
      (data: Uint8Array) => {
        const output = decoder.decode(data);
        actualOutput.push(output);
        if (actualOutput.length === expectedOutput.length - 1) resolvePromise();
        return data.length;
      },
    );

    const spinner = new Spinner({ message: "Spinning with Deno 🦕" });
    spinner.start();
    await promise;
    spinner.stop();
    assertEquals(actualOutput, expectedOutput);
  } finally {
    restore();
  }
});

Deno.test("Spinner constructor accepts interval", async () => {
  try {
    using time = new FakeTime();
    const expectedOutput = [
      "\r\x1b[K⠋\x1b[0m ",
      "\r\x1b[K⠙\x1b[0m ",
      "\r\x1b[K⠹\x1b[0m ",
      "\r\x1b[K⠸\x1b[0m ",
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

    const spinner = new Spinner({ interval: 300 });
    spinner.start();
    await time.tick(1000);
    spinner.stop();
    assertEquals(actualOutput, expectedOutput);
  } finally {
    restore();
  }
});

Deno.test("Spinner constructor accepts output", async () => {
  try {
    const expectedOutput = [
      "\r\x1b[K⠋\x1b[0m ",
      "\r\x1b[K⠙\x1b[0m ",
      "\r\x1b[K⠹\x1b[0m ",
      "\r\x1b[K⠸\x1b[0m ",
      "\r\x1b[K⠼\x1b[0m ",
      "\r\x1b[K⠴\x1b[0m ",
      "\r\x1b[K⠦\x1b[0m ",
      "\r\x1b[K⠧\x1b[0m ",
      "\r\x1b[K⠇\x1b[0m ",
      "\r\x1b[K⠏\x1b[0m ",
      "\r\x1b[K",
    ];

    const actualOutput: string[] = [];

    let resolvePromise: (value: void | PromiseLike<void>) => void;
    const promise = new Promise<void>((resolve) => resolvePromise = resolve);

    stub(
      Deno.stderr,
      "writeSync",
      (data: Uint8Array) => {
        const output = decoder.decode(data);
        actualOutput.push(output);
        if (actualOutput.length === expectedOutput.length - 1) resolvePromise();
        return data.length;
      },
    );

    const spinner = new Spinner({ output: Deno.stderr });
    spinner.start();
    await promise;
    spinner.stop();
    assertEquals(actualOutput, expectedOutput);
  } finally {
    restore();
  }
});

Deno.test("Spinner constructor accepts each color", async (t) => {
  await t.step("black", async () => {
    try {
      const expectedOutput = [
        "\r\x1b[K\x1b[30m⠋\x1b[0m ",
        "\r\x1b[K\x1b[30m⠙\x1b[0m ",
        "\r\x1b[K",
      ];

      const actualOutput: string[] = [];

      let resolvePromise: (value: void | PromiseLike<void>) => void;
      const promise = new Promise<void>((resolve) => resolvePromise = resolve);

      stub(
        Deno.stdout,
        "writeSync",
        (data: Uint8Array) => {
          const output = decoder.decode(data);
          actualOutput.push(output);
          if (actualOutput.length === expectedOutput.length - 1) {
            resolvePromise();
          }
          return data.length;
        },
      );

      const spinner = new Spinner({ color: "black" });
      spinner.start();
      await promise;
      spinner.stop();
      assertEquals(actualOutput, expectedOutput);
    } finally {
      restore();
    }
  });
  await t.step("red", async () => {
    try {
      const expectedOutput = [
        "\r\x1b[K\x1b[31m⠋\x1b[0m ",
        "\r\x1b[K\x1b[31m⠙\x1b[0m ",
        "\r\x1b[K",
      ];

      const actualOutput: string[] = [];

      let resolvePromise: (value: void | PromiseLike<void>) => void;
      const promise = new Promise<void>((resolve) => resolvePromise = resolve);

      stub(
        Deno.stdout,
        "writeSync",
        (data: Uint8Array) => {
          const output = decoder.decode(data);
          actualOutput.push(output);
          if (actualOutput.length === expectedOutput.length - 1) {
            resolvePromise();
          }
          return data.length;
        },
      );

      const spinner = new Spinner({ color: "red" });
      spinner.start();
      await promise;
      spinner.stop();
      assertEquals(actualOutput, expectedOutput);
    } finally {
      restore();
    }
  });
  await t.step("green", async () => {
    try {
      const expectedOutput = [
        "\r\x1b[K\x1b[32m⠋\x1b[0m ",
        "\r\x1b[K\x1b[32m⠙\x1b[0m ",
        "\r\x1b[K",
      ];

      const actualOutput: string[] = [];

      let resolvePromise: (value: void | PromiseLike<void>) => void;
      const promise = new Promise<void>((resolve) => resolvePromise = resolve);

      stub(
        Deno.stdout,
        "writeSync",
        (data: Uint8Array) => {
          const output = decoder.decode(data);
          actualOutput.push(output);
          if (actualOutput.length === expectedOutput.length - 1) {
            resolvePromise();
          }
          return data.length;
        },
      );

      const spinner = new Spinner({ color: "green" });
      spinner.start();
      await promise;
      spinner.stop();
      assertEquals(actualOutput, expectedOutput);
    } finally {
      restore();
    }
  });
  await t.step("yellow", async () => {
    try {
      const expectedOutput = [
        "\r\x1b[K\x1b[33m⠋\x1b[0m ",
        "\r\x1b[K\x1b[33m⠙\x1b[0m ",
        "\r\x1b[K",
      ];

      const actualOutput: string[] = [];

      let resolvePromise: (value: void | PromiseLike<void>) => void;
      const promise = new Promise<void>((resolve) => resolvePromise = resolve);

      stub(
        Deno.stdout,
        "writeSync",
        (data: Uint8Array) => {
          const output = decoder.decode(data);
          actualOutput.push(output);
          if (actualOutput.length === expectedOutput.length - 1) {
            resolvePromise();
          }
          return data.length;
        },
      );

      const spinner = new Spinner({ color: "yellow" });
      spinner.start();
      await promise;
      spinner.stop();
      assertEquals(actualOutput, expectedOutput);
    } finally {
      restore();
    }
  });
  await t.step("blue", async () => {
    try {
      const expectedOutput = [
        "\r\x1b[K\x1b[34m⠋\x1b[0m ",
        "\r\x1b[K\x1b[34m⠙\x1b[0m ",
        "\r\x1b[K",
      ];

      const actualOutput: string[] = [];

      let resolvePromise: (value: void | PromiseLike<void>) => void;
      const promise = new Promise<void>((resolve) => resolvePromise = resolve);

      stub(
        Deno.stdout,
        "writeSync",
        (data: Uint8Array) => {
          const output = decoder.decode(data);
          actualOutput.push(output);
          if (actualOutput.length === expectedOutput.length - 1) {
            resolvePromise();
          }
          return data.length;
        },
      );

      const spinner = new Spinner({ color: "blue" });
      spinner.start();
      await promise;
      spinner.stop();
      assertEquals(actualOutput, expectedOutput);
    } finally {
      restore();
    }
  });
  await t.step("magenta", async () => {
    try {
      const expectedOutput = [
        "\r\x1b[K\x1b[35m⠋\x1b[0m ",
        "\r\x1b[K\x1b[35m⠙\x1b[0m ",
        "\r\x1b[K",
      ];

      const actualOutput: string[] = [];

      let resolvePromise: (value: void | PromiseLike<void>) => void;
      const promise = new Promise<void>((resolve) => resolvePromise = resolve);

      stub(
        Deno.stdout,
        "writeSync",
        (data: Uint8Array) => {
          const output = decoder.decode(data);
          actualOutput.push(output);
          if (actualOutput.length === expectedOutput.length - 1) {
            resolvePromise();
          }
          return data.length;
        },
      );

      const spinner = new Spinner({ color: "magenta" });
      spinner.start();
      await promise;
      spinner.stop();
      assertEquals(actualOutput, expectedOutput);
    } finally {
      restore();
    }
  });
  await t.step("cyan", async () => {
    try {
      const expectedOutput = [
        "\r\x1b[K\x1b[36m⠋\x1b[0m ",
        "\r\x1b[K\x1b[36m⠙\x1b[0m ",
        "\r\x1b[K",
      ];

      const actualOutput: string[] = [];

      let resolvePromise: (value: void | PromiseLike<void>) => void;
      const promise = new Promise<void>((resolve) => resolvePromise = resolve);

      stub(
        Deno.stdout,
        "writeSync",
        (data: Uint8Array) => {
          const output = decoder.decode(data);
          actualOutput.push(output);
          if (actualOutput.length === expectedOutput.length - 1) {
            resolvePromise();
          }
          return data.length;
        },
      );

      const spinner = new Spinner({ color: "cyan" });
      spinner.start();
      await promise;
      spinner.stop();
      assertEquals(actualOutput, expectedOutput);
    } finally {
      restore();
    }
  });
  await t.step("white", async () => {
    try {
      const expectedOutput = [
        "\r\x1b[K\x1b[37m⠋\x1b[0m ",
        "\r\x1b[K\x1b[37m⠙\x1b[0m ",
        "\r\x1b[K",
      ];

      const actualOutput: string[] = [];

      let resolvePromise: (value: void | PromiseLike<void>) => void;
      const promise = new Promise<void>((resolve) => resolvePromise = resolve);

      stub(
        Deno.stdout,
        "writeSync",
        (data: Uint8Array) => {
          const output = decoder.decode(data);
          actualOutput.push(output);
          if (actualOutput.length === expectedOutput.length - 1) {
            resolvePromise();
          }
          return data.length;
        },
      );

      const spinner = new Spinner({ color: "white" });
      spinner.start();
      await promise;
      spinner.stop();
      assertEquals(actualOutput, expectedOutput);
    } finally {
      restore();
    }
  });
  await t.step("gray", async () => {
    try {
      const expectedOutput = [
        "\r\x1b[K\x1b[90m⠋\x1b[0m ",
        "\r\x1b[K\x1b[90m⠙\x1b[0m ",
        "\r\x1b[K",
      ];

      const actualOutput: string[] = [];

      let resolvePromise: (value: void | PromiseLike<void>) => void;
      const promise = new Promise<void>((resolve) => resolvePromise = resolve);

      stub(
        Deno.stdout,
        "writeSync",
        (data: Uint8Array) => {
          const output = decoder.decode(data);
          actualOutput.push(output);
          if (actualOutput.length === expectedOutput.length - 1) {
            resolvePromise();
          }
          return data.length;
        },
      );

      const spinner = new Spinner({ color: "gray" });
      spinner.start();
      await promise;
      spinner.stop();
      assertEquals(actualOutput, expectedOutput);
    } finally {
      restore();
    }
  });
});

Deno.test("Spinner.color can set each color", async () => {
  try {
    const expectedOutput = [
      "\r\x1b[K⠋\x1b[0m ",
      "\r\x1b[K\x1b[30m⠙\x1b[0m ",
      "\r\x1b[K",
    ];

    const actualOutput: string[] = [];

    let resolvePromise: (value: void | PromiseLike<void>) => void;
    const promise = new Promise<void>((resolve) => resolvePromise = resolve);

    const spinner = new Spinner();

    stub(
      Deno.stdout,
      "writeSync",
      (data: Uint8Array) => {
        const output = decoder.decode(data);
        actualOutput.push(output);
        spinner.color = "black";
        if (actualOutput.length === expectedOutput.length - 1) resolvePromise();
        return data.length;
      },
    );

    spinner.start();
    await promise;
    spinner.stop();
    assertEquals(actualOutput, expectedOutput);
  } finally {
    restore();
  }
});

Deno.test("Spinner.color can get each color", () => {
  const spinner = new Spinner();

  spinner.color = "black";
  assertEquals(spinner.color, "\u001b[30m");

  spinner.color = "red";
  assertEquals(spinner.color, "\u001b[31m");

  spinner.color = "green";
  assertEquals(spinner.color, "\u001b[32m");

  spinner.color = "yellow";
  assertEquals(spinner.color, "\u001b[33m");

  spinner.color = "blue";
  assertEquals(spinner.color, "\u001b[34m");

  spinner.color = "magenta";
  assertEquals(spinner.color, "\u001b[35m");

  spinner.color = "cyan";
  assertEquals(spinner.color, "\u001b[36m");

  spinner.color = "white";
  assertEquals(spinner.color, "\u001b[37m");

  spinner.color = "gray";
  assertEquals(spinner.color, "\u001b[90m");
});

Deno.test("Spinner.message can be updated", async () => {
  try {
    const expectedOutput = [
      "\r\x1b[K⠋\x1b[0m One dino 🦕",
      "\r\x1b[K⠙\x1b[0m Two dinos 🦕🦕",
      "\r\x1b[K",
    ];

    const actualOutput: string[] = [];

    let resolvePromise: (value: void | PromiseLike<void>) => void;
    const promise = new Promise<void>((resolve) => resolvePromise = resolve);

    const spinner = new Spinner({ message: "One dino 🦕" });

    stub(
      Deno.stdout,
      "writeSync",
      (data: Uint8Array) => {
        const output = decoder.decode(data);
        actualOutput.push(output);
        spinner.message = "Two dinos 🦕🦕";
        if (actualOutput.length === expectedOutput.length - 1) resolvePromise();
        return data.length;
      },
    );

    spinner.start();
    await promise;
    spinner.stop();
    assertEquals(actualOutput, expectedOutput);
  } finally {
    restore();
  }
});

Deno.test(
  "Spinner brackets each TTY frame with DECAWM off/on so the terminal truncates overflow (#6975)",
  async () => {
    try {
      // The message is no longer truncated in user space; we emit \x1b[?7l
      // before the frame and \x1b[?7h after, and the terminal silently drops
      // anything past the right edge instead of wrapping.
      const message = "x".repeat(50);
      const expectedOutput = [
        `\r\x1b[K\x1b[?7l⠋\x1b[0m ${message}\x1b[?7h`,
        `\r\x1b[K\x1b[?7l⠙\x1b[0m ${message}\x1b[?7h`,
        `\r\x1b[K\x1b[?7l⠹\x1b[0m ${message}\x1b[?7h`,
        "\r\x1b[K",
      ];

      const actualOutput: string[] = [];

      let resolvePromise: (value: void | PromiseLike<void>) => void;
      const promise = new Promise<void>((resolve) => resolvePromise = resolve);

      stub(Deno.stdout, "isTerminal", () => true);
      stub(
        Deno.stdout,
        "writeSync",
        (data: Uint8Array) => {
          const output = decoder.decode(data);
          actualOutput.push(output);
          if (actualOutput.length === expectedOutput.length - 1) {
            resolvePromise();
          }
          return data.length;
        },
      );

      const spinner = new Spinner({ message });
      spinner.start();
      await promise;
      spinner.stop();
      assertEquals(actualOutput, expectedOutput);
    } finally {
      restore();
    }
  },
);

Deno.test(
  "Spinner does not emit DECAWM toggles when output is not a TTY (#6975)",
  async () => {
    try {
      // On a piped/redirected stream the literal escape bytes would just
      // clutter the output, so isTerminal()=false → skip the toggles and
      // write the message as-is.
      const message = "x".repeat(50);
      const expectedOutput = [
        `\r\x1b[K⠋\x1b[0m ${message}`,
        `\r\x1b[K⠙\x1b[0m ${message}`,
        "\r\x1b[K",
      ];

      const actualOutput: string[] = [];

      let resolvePromise: (value: void | PromiseLike<void>) => void;
      const promise = new Promise<void>((resolve) => resolvePromise = resolve);

      stub(Deno.stdout, "isTerminal", () => false);
      stub(
        Deno.stdout,
        "writeSync",
        (data: Uint8Array) => {
          const output = decoder.decode(data);
          actualOutput.push(output);
          if (actualOutput.length === expectedOutput.length - 1) {
            resolvePromise();
          }
          return data.length;
        },
      );

      const spinner = new Spinner({ message });
      spinner.start();
      await promise;
      spinner.stop();
      assertEquals(actualOutput, expectedOutput);
    } finally {
      restore();
    }
  },
);

Deno.test("Spinner handles multiple start() calls", () => {
  const spinner = new Spinner();

  spinner.start();
  spinner.start();
  spinner.stop();
});

Deno.test("Spinner handles multiple stop() calls", () => {
  const spinner = new Spinner();

  spinner.start();
  spinner.stop();
  spinner.stop();
});
