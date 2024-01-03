// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/assert_equals.ts";
import { split } from "./_util.ts";

Deno.test({
  name: "split() handles whitespace",
  fn() {
    const result = split("deno Is AWESOME");
    const expected = ["deno", "Is", "AWESOME"];
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "split() trims input",
  async fn(t) {
    await t.step({
      name: "whitespace",
      fn() {
        const result = split("  deno  Is AWESOME ");
        const expected = ["deno", "Is", "AWESOME"];
        assertEquals(result, expected);
      },
    });
    await t.step({
      name: "camel case",
      fn() {
        const result = split("  denoIsAwesome ");
        const expected = ["deno", "Is", "Awesome"];
        assertEquals(result, expected);
      },
    });
    await t.step({
      name: "kebab case",
      fn() {
        const result = split("--deno--is-awesome-");
        const expected = ["deno", "is", "awesome"];
        assertEquals(result, expected);
      },
    });
    await t.step({
      name: "screaming snake case",
      fn() {
        const result = split(" __DENO__IS_AWESOME_ ");
        const expected = ["DENO", "IS", "AWESOME"];
        assertEquals(result, expected);
      },
    });
    await t.step({
      name: "sentence case",
      fn() {
        const result = split("  Deno  is awesome ");
        const expected = ["Deno", "is", "awesome"];
        assertEquals(result, expected);
      },
    });
    await t.step({
      name: "snake case",
      fn() {
        const result = split(" __deno__is_awesome_ ");
        const expected = ["deno", "is", "awesome"];
        assertEquals(result, expected);
      },
    });
    await t.step({
      name: "title case",
      fn() {
        const result = split("  Deno  Is Awesome ");
        const expected = ["Deno", "Is", "Awesome"];
        assertEquals(result, expected);
      },
    });
  },
});

Deno.test({
  name: "split() handles camel case",
  fn() {
    const result = split("denoIsAwesome");
    const expected = ["deno", "Is", "Awesome"];
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "split() handles kebab case",
  fn() {
    const result = split("deno-is-awesome");
    const expected = ["deno", "is", "awesome"];
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "split() handles pascal case",
  fn() {
    const result = split("DenoIsAwesome");
    const expected = ["Deno", "Is", "Awesome"];
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "split() handles screaming snake case",
  fn() {
    const result = split("DENO_IS_AWESOME");
    const expected = ["DENO", "IS", "AWESOME"];
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "split() handles sentence case",
  fn() {
    const result = split("Deno is awesome");
    const expected = ["Deno", "is", "awesome"];
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "split() handles snake case",
  fn() {
    const result = split("deno_is_awesome");
    const expected = ["deno", "is", "awesome"];
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "split() handles title case",
  fn() {
    const result = split("Deno Is Awesome");
    const expected = ["Deno", "Is", "Awesome"];
    assertEquals(result, expected);
  },
});
