// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert } from "../testing/asserts.ts";
import { isValidOperator } from "./is_valid_operator.ts";

Deno.test({
  name: "valid_operators",
  fn: async (t) => {
    const operators: unknown[] = [
      "",
      "=",
      "==",
      "===",
      "!=",
      "!==",
      ">",
      ">=",
      "<",
      "<=",
    ];
    for (const op of operators) {
      await t.step(`valid operator ${op}`, () => {
        const actual = isValidOperator(op);
        assert(actual);
      });
    }
  },
});
