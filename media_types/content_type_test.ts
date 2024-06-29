// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { contentType } from "./content_type.ts";
import { assertEquals } from "@std/assert";

Deno.test({
  name: "contentType()",
  fn() {
    const fixtures = [
      [" ; charset=UTF-8", undefined],
      [".json", "application/json; charset=UTF-8"],
      ["text/html", "text/html; charset=UTF-8"],
      ["txt", "text/plain; charset=UTF-8"],
      ["text/plain; charset=ISO-8859-1", "text/plain; charset=ISO-8859-1"],
      ["text/plan; charset", undefined],
      ["foo", undefined],
      ["file.json", undefined],
      ["application/foo", "application/foo"],
    ] as const;
    for (const [fixture, expected] of fixtures) {
      assertEquals(contentType(fixture), expected);
    }
  },
});

Deno.test({
  name: "contentType() implies types",
  fn() {
    let _str: string;
    // For well-known content types, the return type is a string.
    // string is assignable to string
    _str = contentType(".json");
    _str = contentType("text/html");
    _str = contentType("txt");

    _str = contentType("text/plain; charset=ISO-8859-1");
    _str = contentType("foo");
    _str = contentType("file.json");
    _str = contentType("application/foo");
  },
});
