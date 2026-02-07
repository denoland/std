// Copyright 2018-2026 the Deno authors. MIT license.
import { HEADER } from "./unstable_header.ts";
import { assertEquals } from "@std/assert";

Deno.test({
  name: "HEADER",
  fn() {
    // just spot check a few common codes
    assertEquals(HEADER.Accept, "Accept");
    assertEquals(HEADER.AIm, "A-IM");
    assertEquals(HEADER.AcceptQuery, "Accept-Query");
    assertEquals(HEADER.AvailableDictionary, "Available-Dictionary");
    assertEquals(HEADER.CacheGroupInvalidation, "Cache-Group-Invalidation");
    assertEquals(HEADER.ClientCertChain, "Client-Cert-Chain");
    assertEquals(HEADER.ConcealedAuthExport, "Concealed-Auth-Export");
    assertEquals(HEADER.Connection, "Connection");
    assertEquals(HEADER.Deprecation, "Deprecation");
    assertEquals(HEADER.DetachedJws, "Detached-JWS");
    assertEquals(HEADER.DictionaryId, "Dictionary-ID");
    assertEquals(HEADER.LinkTemplate, "Link-Template");
    assertEquals(HEADER.Origin, "Origin");
    assertEquals(HEADER.Referer, "Referer");
    assertEquals(HEADER.ReferrerPolicy, "Referrer-Policy");
    assertEquals(HEADER.SecFetchDest, "Sec-Fetch-Dest");
    assertEquals(HEADER.SecFetchMode, "Sec-Fetch-Mode");
    assertEquals(HEADER.SecFetchSite, "Sec-Fetch-Site");
    assertEquals(HEADER.SecFetchUser, "Sec-Fetch-User");
    assertEquals(HEADER.SetTxn, "Set-Txn");
    assertEquals(HEADER.UseAsDictionary, "Use-As-Dictionary");
  },
});
