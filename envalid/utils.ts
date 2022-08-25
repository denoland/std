import { assertEquals } from "../testing/asserts.ts";
import { cleanEnv, ValidatorSpec } from "./mod.ts";

// Ensure that a given environment spec passes through all values from the given
// env object
export const assertPassthrough = <T>(
  env: T,
  // deno-lint-ignore no-explicit-any
  spec: { [k in keyof T]: ValidatorSpec<any> },
) => {
  assertEquals(cleanEnv(env, spec), env);
};
