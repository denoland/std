// Copyright 2018-2026 the Deno authors. MIT license.

import { METHOD } from "./unstable_method.ts";
import { assertEquals } from "@std/assert";

Deno.test({
  name: "METHOD",
  fn() {
    // just spot check a few common methods
    assertEquals(METHOD.Head, "HEAD");
    assertEquals(METHOD.Get, "GET");
    assertEquals(METHOD.Post, "POST");
    assertEquals(METHOD.Put, "PUT");
    assertEquals(METHOD.Delete, "DELETE");
    assertEquals(METHOD.Options, "OPTIONS");
    assertEquals(METHOD.Query, "QUERY");
    assertEquals(METHOD.Label, "LABEL");
  },
});

Deno.test({
  name: "METHOD has the expected number of methods",
  fn() {
    // There are 40 methods in the IANA registry (excluding the wildcard "*")
    assertEquals(Object.keys(METHOD).length, 40);
  },
});
