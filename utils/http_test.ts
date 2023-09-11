// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  assertSpyCall,
  assertSpyCalls,
  returnsNext,
  stub,
} from "std/testing/mock.ts";
import { fetchValues, getCursor, redirect } from "./http.ts";
import { assert, assertEquals, assertRejects } from "std/assert/mod.ts";
import { Status } from "$fresh/server.ts";
import { genNewItem } from "@/utils/db_test.ts";
import { Item } from "@/utils/db.ts";

Deno.test("[http] redirect() defaults", () => {
  const location = "/hello-there";

  const resp = redirect(location);
  assert(!resp.ok);
  assertEquals(resp.body, null);
  assertEquals(resp.headers.get("location"), location);
  assertEquals(resp.status, 303);
});

Deno.test("[http] redirect()", () => {
  const location = "/hello-there";
  const status = 302;

  const resp = redirect(location, status);
  assert(!resp.ok);
  assertEquals(resp.body, null);
  assertEquals(resp.headers.get("location"), location);
  assertEquals(resp.status, status);
});

Deno.test("[http] getCursor()", () => {
  assertEquals(getCursor(new URL("http://example.com")), "");
  assertEquals(getCursor(new URL("http://example.com?cursor=here")), "here");
});

Deno.test("[http] fetchValues()", async () => {
  const resp1 = Promise.resolve(
    new Response(null, { status: Status.NotFound }),
  );
  const resp2Body = {
    values: [genNewItem(), genNewItem()],
    cursor: crypto.randomUUID(),
  };
  const resp2Cursor = crypto.randomUUID();
  const resp2 = Promise.resolve(Response.json(resp2Body));
  const fetchStub = stub(
    globalThis,
    "fetch",
    returnsNext([resp1, resp2]),
  );
  const endpoint = "http://localhost";
  await assertRejects(
    async () => await fetchValues(endpoint, ""),
    Error,
    `Request failed: GET ${endpoint}`,
  );
  assertEquals(
    await fetchValues<Item>(endpoint + "/api/items", resp2Cursor),
    resp2Body,
  );

  fetchStub.restore();

  assertSpyCall(fetchStub, 0, {
    args: [endpoint],
    returned: resp1,
  });
  assertSpyCall(fetchStub, 1, {
    args: [endpoint + "/api/items?cursor=" + resp2Cursor],
    returned: resp2,
  });
  assertSpyCalls(fetchStub, 2);
});
