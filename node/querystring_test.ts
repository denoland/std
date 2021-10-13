// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import { parse, stringify } from "./querystring.ts";

Deno.test({
  name: "stringify",
  fn() {
    assertEquals(
      stringify({
        a: "hello",
        b: 5,
        c: true,
        d: ["foo", "bar"],
      }),
      "a=hello&b=5&c=true&d=foo&d=bar",
    );
  },
});

Deno.test({
  name: "stringify with escape",
  fn() {
    assertEquals(
      stringify({
        a: "hello！",
        b: "こんにちは",
      }),
      "a=hello%EF%BC%81&b=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF",
    );
  },
});

Deno.test({
  name: "parse",
  fn() {
    assertEquals(parse("a=hello&b=5&c=true&d=foo&d=bar"), {
      a: "hello",
      b: "5",
      c: "true",
      d: ["foo", "bar"],
    });
  },
});

Deno.test({
  name: "parse escaped string",
  fn() {
    assertEquals(
      parse("a=hello%EF%BC%81&b=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"),
      {
        a: "hello！",
        b: "こんにちは",
      },
    );
  },
});
