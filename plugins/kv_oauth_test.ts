// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { assertRejects } from "std/assert/assert_rejects.ts";
import { getGitHubUser } from "./kv_oauth.ts";

Deno.test("[plugins] getGitHubUser()", async () => {
  await assertRejects(
    async () => await getGitHubUser("access token"),
    Error,
    "Bad credentials",
  );
});
