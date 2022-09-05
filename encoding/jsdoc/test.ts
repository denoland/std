// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

/**
 * @license
 */
import { assertEquals } from "../../testing/asserts.ts";
import { parse, stringify } from "./mod.ts";

Deno.test("parse", async (t) => {
  await t.step(`single line`, () => {
    const input = `
    /** @module Module */
    `;
    assertEquals(parse(input), [{ name: "module", content: "Module" }]);
  });
  await t.step(`data on closing line`, () => {
    const input = `
    /**
     * @module Module */
    `;
    assertEquals(parse(input), [{ name: "module", content: "Module" }]);
  });
  await t.step(`on opening line`, () => {
    const input = `
    /** @module Module
     */
    `;
    assertEquals(parse(input), [{ name: "module", content: "Module" }]);
  });
  await t.step(`individual line`, () => {
    const input = `
    /**
     * @module Module
     */
    `;
    assertEquals(parse(input), [{ name: "module", content: "Module" }]);
  });
  await t.step(`white space`, () => {
    const input = `
    /**
     * 
     * @module Module
     * 
     */
    `;
    assertEquals(parse(input), [{ name: "module", content: "Module" }]);
  });

  await t.step(`multiple tags`, () => {
    const input = `
    /**
     * 
     * @deprecated
     * @module Module
     * 
     */
    `;
    assertEquals(parse(input), [
      { name: "deprecated" },
      { name: "module", content: "Module" },
    ]);
  });

  await t.step(`inline tag`, () => {
    const input = `
    /**
     * {@linkcode somewhere}
     * @module
     */

    `;
    assertEquals(parse(input), [
      { content: "{@linkcode somewhere}" },
      { name: "module" },
    ]);
  });
});

Deno.test("stringify", async (t) => {
  await t.step(`single tag`, () => {
    const input = `/**\n * @module Module\n */`;
    assertEquals(stringify([{ name: "module", content: "Module" }]), input);
  });
  await t.step(`multiple tags`, () => {
    const input = `/**\n * @deprecated\n * @module Module\n */`;
    assertEquals(
      stringify([
        { name: "deprecated" },
        { name: "module", content: "Module" },
      ]),
      input,
    );
  });

  await t.step(`inline tag`, () => {
    const input = `/**\n * {@linkcode somewhere}\n * @module\n */`;
    assertEquals(
      stringify([
        { content: "{@linkcode somewhere}" },
        { name: "module" },
      ]),
      input,
    );
  });
});
