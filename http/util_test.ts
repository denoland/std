// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { compareEtag } from "./util.ts";
import { assert } from "../testing/asserts.ts";

Deno.test("createEtag", () => {
  const ETAG_A = `"d64dea47ee6fd90800ec546c2544abfb"`;
  const ETAG_B = `"3c09cc24b81163fc20b80fd26eed4832"`;
  assert(compareEtag(ETAG_A, ETAG_A));
  assert(!compareEtag(ETAG_A, ETAG_B));
  assert(compareEtag(ETAG_A, `W/${ETAG_A}`));
  assert(compareEtag(`W/${ETAG_A}`, ETAG_A));
});
