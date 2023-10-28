// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals } from "../assert/mod.ts";

import { HTTP_METHODS, isHttpMethod } from "./method.ts";

Deno.test({
  name: "HTTP_METHODS",
  fn() {
    const methods = [
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "DELETE",
      "CONNECT",
      "OPTIONS",
      "TRACE",
    ] as const;
    for (const method of methods) {
      assert(HTTP_METHODS.includes(method));
    }
    assertEquals(HTTP_METHODS.length, methods.length);
  },
});

Deno.test({
  name: "isHttpMethod",
  fn() {
    assert(isHttpMethod("GET"));
    assert(!isHttpMethod("PUSH"));
    assert(isHttpMethod("M-SEARCH"));
  },
});
