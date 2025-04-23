// Copyright 2018-2025 the Deno authors. MIT license.
import { assert, assertEquals, AssertionError, assertRejects } from "./mod.ts";

Deno.test("assertRejects() with return type", async () => {
  await assertRejects(() => {
    return Promise.reject(new Error());
  });
});

Deno.test("assertRejects() with synchronous function that throws", async () => {
  await assertRejects(() =>
    assertRejects(() => {
      throw new Error();
    })
  );
  await assertRejects(
    () =>
      assertRejects(() => {
        throw { wrong: "true" };
      }),
    AssertionError,
    "Function throws when expected to reject.",
  );
});

Deno.test("assertRejects() with PromiseLike", async () => {
  await assertRejects(
    () => ({
      then() {
        throw new Error("some error");
      },
    }),
    Error,
    "some error",
  );
});

Deno.test("assertRejects() with non-error value rejected and error class", async () => {
  await assertRejects(
    () => {
      return assertRejects(
        () => {
          return Promise.reject("Panic!");
        },
        Error,
        "Panic!",
      );
    },
    AssertionError,
    "A non-Error object was rejected.",
  );
});

Deno.test("assertRejects() with non-error value rejected", async () => {
  await assertRejects(() => {
    return Promise.reject(null);
  });
  await assertRejects(() => {
    return Promise.reject(undefined);
  });
});

Deno.test("assertRejects() with error class", async () => {
  await assertRejects(
    () => {
      return Promise.reject(new Error("foo"));
    },
    Error,
    "foo",
  );
});

Deno.test("assertRejects() resolves with caught error", async () => {
  const error = await assertRejects(
    () => {
      return Promise.reject(new Error("foo"));
    },
  );
  assert(error instanceof Error);
  assertEquals(error.message, "foo");
});

Deno.test("assertRejects() throws async parent error ", async () => {
  await assertRejects(
    () => {
      return Promise.reject(new AssertionError("Fail!"));
    },
    Error,
    "Fail!",
  );
});

Deno.test("assertRejects() accepts abstract class", () => {
  abstract class AbstractError extends Error {}
  class ConcreteError extends AbstractError {}

  assertRejects(
    () => Promise.reject(new ConcreteError("failed")),
    AbstractError,
    "fail",
  );
});

Deno.test(
  "assertRejects() throws with custom Error",
  async () => {
    class CustomError extends Error {}
    class AnotherCustomError extends Error {}
    await assertRejects(
      () =>
        assertRejects(
          () => Promise.reject(new AnotherCustomError("failed")),
          CustomError,
          "fail",
        ),
      AssertionError,
      'Expected error to be instance of "CustomError", but was "AnotherCustomError".',
    );
  },
);

Deno.test("assertRejects() throws when no promise is returned", async () => {
  await assertRejects(
    // @ts-expect-error - testing invalid input
    async () => await assertRejects(() => {}),
    AssertionError,
    "Function throws when expected to reject.",
  );
});

Deno.test("assertRejects() throws when the promise doesn't reject", async () => {
  await assertRejects(
    async () => await assertRejects(async () => await Promise.resolve(42)),
    AssertionError,
    "Expected function to reject.",
  );
});

Deno.test("assertRejects() throws with custom message", async () => {
  await assertRejects(
    async () =>
      await assertRejects(
        async () => await Promise.resolve(42),
        "CUSTOM MESSAGE",
      ),
    AssertionError,
    "Expected function to reject: CUSTOM MESSAGE",
  );
});
