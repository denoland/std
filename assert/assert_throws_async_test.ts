// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import {
  assert,
  assertEquals,
  AssertionError,
  assertThrowsAsync,
  fail,
} from "./mod.ts";

Deno.test(
  "assertThrowsAsync() throws when thrown error class does not match expected",
  async () => {
    await assertThrowsAsync(
      async () => {
        //This next assertThrows will throw an AssertionError due to the wrong
        //expected error class
        await assertThrowsAsync(
          async () => {
            return await new Promise(() => {
              fail("foo");
            });
          },
          TypeError,
          "Failed assertion: foo"
        );
      },
      AssertionError,
      `Expected error to be instance of "TypeError", but was "AssertionError"`
    );
  }
);

Deno.test("assertThrows() changes its return type by parameter", async () => {
  await assertThrowsAsync(async () => {
    return await new Promise(() => {
      throw new Error();
    });
  });
});

Deno.test(
  "assertThrows() throws when error class is expected but non-error value is thrown",
  async () => {
    await assertThrowsAsync(
      async () => {
        await assertThrowsAsync(
          async () => {
            return await new Promise(() => {
              throw "Panic!";
            });
          },
          Error,
          "Panic!"
        );
      },
      AssertionError,
      "A non-Error object was thrown."
    );
  }
);

Deno.test("assertThrows() matches thrown non-error value", async () => {
  await await assertThrowsAsync(async () => {
    return new Promise(() => {
      throw "Panic!";
    });
  });

  await assertThrowsAsync(async () => {
    return await new Promise(() => {
      throw null;
    });
  });

  await assertThrowsAsync(async () => {
    return await new Promise(() => {
      throw undefined;
    });
  });
});

Deno.test(
  "assertThrows() matches thrown error with given error class",
  async () => {
    await assertThrowsAsync(
      async () => {
        return await new Promise(() => {
          throw new Error("foo");
        });
      },
      Error,
      "foo"
    );
  }
);

Deno.test("assertThrows() matches and returns thrown error value", async () => {
  const error = await assertThrowsAsync(async () => {
    return await new Promise(() => {
      throw new Error("foo");
    });
  });
  assert(error instanceof Error);
  assertEquals(error.message, "foo");
});

Deno.test("assertThrows() matches and returns thrown non-error", async () => {
  const stringError = await assertThrowsAsync(async () => {
    return await new Promise(() => {
      throw "Panic!";
    });
  });
  assert(typeof stringError === "string");
  assertEquals(stringError, "Panic!");

  const numberError = await assertThrowsAsync(async () => {
    return await new Promise(() => {
      throw 1;
    });
  });
  assert(typeof numberError === "number");
  assertEquals(numberError, 1);

  const nullError = await assertThrowsAsync(async () => {
    return await new Promise(() => {
      throw null;
    });
  });
  assert(nullError === null);

  const undefinedError = await assertThrowsAsync(async () => {
    return await new Promise(() => {
      throw undefined;
    });
  });
  assert(typeof undefinedError === "undefined");
  assertEquals(undefinedError, undefined);
});

Deno.test("assertThrows() matches subclass of expected error", async () => {
  await assertThrowsAsync(
    async () => {
      return await new Promise(() => {
        throw new AssertionError("Fail!");
      });
    },
    Error,
    "Fail!"
  );
});
