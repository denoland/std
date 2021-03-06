// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { parse, parseAll } from "./parse.ts";
import { assertEquals, assertThrows } from "../../testing/asserts.ts";
import { DEFAULT_SCHEMA, EXTENDED_SCHEMA } from "./schema/mod.ts";
import { YAMLError } from "./error.ts";
import { Type } from "./type.ts";

Deno.test({
  name: "`parse` parses single document yaml string",
  fn(): void {
    const yaml = `
      test: toto
      foo:
        bar: True
        baz: 1
        qux: ~
    `;

    const expected = { test: "toto", foo: { bar: true, baz: 1, qux: null } };

    assertEquals(parse(yaml), expected);
  },
});

Deno.test({
  name: "`parseAll` parses the yaml string with multiple documents",
  fn(): void {
    const yaml = `
---
id: 1
name: Alice
---
id: 2
name: Bob
---
id: 3
name: Eve
    `;
    const expected = [
      {
        id: 1,
        name: "Alice",
      },
      {
        id: 2,
        name: "Bob",
      },
      {
        id: 3,
        name: "Eve",
      },
    ];
    assertEquals(parseAll(yaml), expected);
  },
});

Deno.test({
  name: "`!!js/*` yaml types are not handled in default schemas",
  fn(): void {
    const yaml = `undefined: !!js/undefined ~`;
    assertThrows(() => parse(yaml), YAMLError, "unknown tag !");
  },
});

Deno.test({
  name: "`!!js/*` yaml types are correctly handled with extended schema",
  fn(): void {
    const yaml = `
      regexp:
        simple: !!js/regexp foobar
        modifiers: !!js/regexp /foobar/mi
      undefined: !!js/undefined ~
    `;

    const expected = {
      regexp: {
        simple: /foobar/,
        modifiers: /foobar/mi,
      },
      undefined: undefined,
    };

    assertEquals(parse(yaml, { schema: EXTENDED_SCHEMA }), expected);
  },
});

Deno.test({
  name: "`!!js/function` yaml type is correctly handled with extended schema",
  fn(): void {
    const func = function foobar() {
      return "hello world!";
    };

    const yaml = `
function: !!js/function >
${func.toString().split("\n").map((line) => `  ${line}`).join("\n")}
`;

    const parsed = parse(yaml, { schema: EXTENDED_SCHEMA }) as {
      [key: string]: unknown;
    };

    assertEquals(Object.keys(parsed).length, 1);
    assertEquals((parsed?.function as typeof func).toString(), func.toString());
  },
});

Deno.test({
  name: "`!*` yaml user defined types are supported",
  fn(): void {
    const PointYamlType = new Type("!point", {
      kind: "sequence",
      resolve(data) {
        return data !== null && data?.length === 3;
      },
      construct(data) {
        const [x, y, z] = data;
        return { x, y, z };
      },
      represent(point) {
        return JSON.stringify(point);
      },
    });
    const SPACE_SCHEMA = DEFAULT_SCHEMA.extend({ explicit: [PointYamlType] });

    const yaml = `
      point: !point [1, 2, 3]
    `;

    assertEquals(parse(yaml, { schema: SPACE_SCHEMA }), {
      point: { x: 1, y: 2, z: 3 },
    });
  },
});
