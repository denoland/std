// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { assertRejects } from "std/assert/assert_rejects.ts";
import { getGitHubUser } from "./github.ts";
import { returnsNext, stub } from "std/testing/mock.ts";
import { Status } from "$fresh/server.ts";
import { errors } from "std/http/http_errors.ts";
import { assertEquals } from "std/assert/assert_equals.ts";

Deno.test("[plugins] getGitHubUser()", async () => {
  const message = crypto.randomUUID();
  const resp1Body = { message };
  const resp1 = Promise.resolve(
    Response.json(resp1Body, { status: Status.BadRequest }),
  );
  const resp2Body = { login: crypto.randomUUID(), email: crypto.randomUUID() };
  const resp2 = Promise.resolve(Response.json(resp2Body));
  const fetchStub = stub(globalThis, "fetch", returnsNext([resp1, resp2]));

  const accessToken1 = crypto.randomUUID();
  const accessToken2 = crypto.randomUUID();
  await assertRejects(
    async () => await getGitHubUser(accessToken1),
    errors.BadRequest,
    message,
  );
  assertEquals(await getGitHubUser(accessToken2), resp2Body);

  fetchStub.restore();
});
