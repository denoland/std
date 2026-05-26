// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertInstanceOf } from "@std/assert";
import { YamlSyntaxError } from "./types.ts";

Deno.test("YamlSyntaxError() is a SyntaxError", () => {
  const error = new YamlSyntaxError("oops", { line: 1, column: 1, offset: 0 });
  assertInstanceOf(error, SyntaxError);
  assertEquals(error.name, "YamlSyntaxError");
});

Deno.test("YamlSyntaxError() exposes structured position info", () => {
  const error = new YamlSyntaxError("oops", {
    line: 5,
    column: 10,
    offset: 50,
  });
  assertEquals(error.line, 5);
  assertEquals(error.column, 10);
  assertEquals(error.offset, 50);
  assertEquals(error.snippet, undefined);
});

Deno.test("YamlSyntaxError() formats message without snippet", () => {
  const error = new YamlSyntaxError("oops", {
    line: 5,
    column: 10,
    offset: 50,
  });
  assertEquals(error.message, "oops at line 5, column 10");
});

Deno.test("YamlSyntaxError() formats message with snippet", () => {
  const snippet = "    foo: bar\n         ^";
  const error = new YamlSyntaxError(
    "oops",
    { line: 1, column: 6, offset: 5 },
    snippet,
  );
  assertEquals(
    error.message,
    `oops at line 1, column 6:\n${snippet}`,
  );
  assertEquals(error.snippet, snippet);
});
