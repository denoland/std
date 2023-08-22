// Copyright 2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "std/testing/asserts.ts";
import { isPublicUrl, isValidUrl } from "./url_validation.ts";

Deno.test("[url_validation] isValidUrl()", () => {
  assertEquals(isValidUrl("https://hunt.deno.land/"), true);
  assertEquals(isValidUrl("http://hunt.deno.land/"), true);
  assertEquals(isValidUrl("ws://hunt.deno.land/"), false);
  assertEquals(isValidUrl("wss://hunt.deno.land/"), false);
  assertEquals(isValidUrl("invalidurl"), false);
});

Deno.test("[url_validation] isPublicUrl()", () => {
  assertEquals(isPublicUrl("https://hunt.deno.land/"), true);
  assertEquals(isPublicUrl("http://hunt.deno.land/"), true);
  assertEquals(isPublicUrl("ws://hunt.deno.land/"), true);
  assertEquals(isPublicUrl("http://localhost/"), false);
  assertEquals(isPublicUrl("http://127.0.0.1/"), false);
  assertEquals(isPublicUrl("http://::1/"), false);
  assertEquals(isPublicUrl("http://10.0.0.0/"), false);
  assertEquals(isPublicUrl("http://172.16.0.0/"), false);
  assertEquals(isPublicUrl("http://192.168.0.0/"), false);
});
