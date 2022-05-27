// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright (c) 2014 Jonathan Ong <me@jongleberry.com>
// Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>
// Copyright (c) 2020-2022 the oak authors

import { assertEquals } from "../testing/asserts.ts";
import { contentType } from "./content_type.ts";

Deno.test("contentType", () => {
  assertEquals(contentType(".html"), "text/html; charset=UTF-8");
  assertEquals(contentType(".HTML"), "text/html; charset=UTF-8");
  assertEquals(contentType(".js"), "application/javascript; charset=UTF-8");
  assertEquals(contentType(".ts"), "video/mp2t");
  assertEquals(contentType(".mp4"), "video/mp4");
  assertEquals(contentType(".axasdasdasdasd"), undefined);
  assertEquals(contentType("html"), undefined);
  assertEquals(contentType("foo.html"), undefined);
  assertEquals(contentType("path/to/foo.html"), undefined);
});
