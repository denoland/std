// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert/equals";
import { parse } from "./unstable_parse.ts";

Deno.test("(unstable) parse() supports `types[]` option for customizing types", () => {
  const yaml = `---
id: 1
foo: !foo bar
`;

  const result = parse(yaml, {
    types: [{
      tag: "!foo",
      kind: "scalar",
      construct: (data) => {
        const result: string = data !== null ? data : "";
        return {
          value: result,
          tag: "!foo",
        };
      },
    }],
  });
  assertEquals(result, { id: 1, foo: { value: "bar", tag: "!foo" } });
});
