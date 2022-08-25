import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { cleanEnv, customCleanEnv, str } from "./mod.ts";

Deno.test("customCleanEnv middleware type inference", async (t) => {
  await t.step("allows access to properties on the output object", () => {
    const raw = { FOO: "bar" };
    const cleaned = customCleanEnv(raw, { FOO: str() }, (inputEnv) => ({
      ...inputEnv,
      FOO: inputEnv.FOO.toUpperCase(),
      ADDED: 123,
    }));

    assertEquals(cleaned, { FOO: "BAR", ADDED: 123 });
  });

  await t.step("flags errors on input env", () => {
    const noop = (x: unknown) => x;
    const raw = { FOO: "bar" };
    const cleaned = customCleanEnv(raw, { FOO: str() }, (inputEnv) => {
      // @ts-expect-error Inference should tell us this property is invalid
      noop(inputEnv.WRONG_NAME);
      return inputEnv;
    });

    assertEquals(cleaned, raw);
  });
});

Deno.test("proxy middleware", async (t) => {
  await t.step(
    "only specified fields are passed through from validation",
    () => {
      const env = cleanEnv(
        { FOO: "bar", BAZ: "baz" },
        {
          FOO: str(),
        },
      );
      assertEquals(env, { FOO: "bar" });
    },
  );

  await t.step("proxy throws when invalid attrs are accessed", () => {
    const env = cleanEnv(
      { FOO: "bar", BAZ: "baz" },
      {
        FOO: str(),
      },
    );
    assertEquals(env.FOO, "bar");
    // @ts-expect-error This invalid usage should trigger a type error
    assertThrows(() => env.ASDF);
  });

  await t.step("proxy throws when attempting to mutate", () => {
    const env = cleanEnv(
      { FOO: "bar", BAZ: "baz" },
      {
        FOO: str(),
      },
    );
    assertThrows(
      // @ts-expect-error This invalid usage should trigger a type error
      () => (env.FOO = "foooooo"),
      "[envalid] Attempt to mutate environment value: FOO",
    );
  });

  await t.step(
    "proxy throws and suggests to add a validator if name is in orig env",
    () => {
      const env = cleanEnv(
        { FOO: "foo", BAR: "wat" },
        {
          BAR: str(),
        },
      );

      assertThrows(
        // @ts-expect-error This invalid usage should trigger a type error
        () => env.FOO,
        "[envalid] Env var FOO was accessed but not validated. This var is set in the environment; please add an envalid validator for it.",
      );
    },
  );

  await t.step("proxy does not error out on .length checks (#70)", () => {
    const env = cleanEnv(
      { FOO: "foo" },
      {
        FOO: str(),
      },
    );

    // @ts-expect-error This invalid usage should trigger a type error
    assertThrows(() => assertThrows(() => env.length));
  });

  await t.step("proxy allows `then` on self", () => {
    const env = cleanEnv(
      { FOO: "foo" },
      {
        FOO: str(),
      },
    );

    // @ts-expect-error This invalid usage should trigger a type error
    assertThrows(() => assertThrows(() => env.then));
  });

  await t.step("proxy allows `__esModule` on self", () => {
    const env = cleanEnv(
      { FOO: "foo" },
      {
        FOO: str(),
      },
    );

    // @ts-expect-error This invalid usage should trigger a type error
    assertThrows(() => assertThrows(() => env.__esModule));
  });

  await t.step("proxy allows JSON.stringify to be called on output", () => {
    const env = cleanEnv(
      { FOO: "foo" },
      {
        FOO: str(),
      },
    );

    assertThrows(() => assertThrows(() => JSON.stringify(env)));
    assertEquals(JSON.stringify(env), '{"FOO":"foo"}');
  });
});
