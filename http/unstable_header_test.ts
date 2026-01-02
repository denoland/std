// Copyright 2018-2026 the Deno authors. MIT license.
import { HEADER } from "./unstable_header.ts";
import { assertEquals } from "@std/assert";

Deno.test({
  name: "HEADER",
  fn() {
    // just spot check a few common codes
    assertEquals(HEADER.Accept, "Accept");
    assertEquals(HEADER.AIm, "A-IM");
    assertEquals(HEADER.ClientCertChain, "Client-Cert-Chain");
    assertEquals(HEADER.Connection, "Connection");
    assertEquals(HEADER.Origin, "Origin");
    assertEquals(HEADER.Referer, "Referer");
  },
});
