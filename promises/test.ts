// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { assert, test } from "../testing/mod.ts";
import { defer, Deferred } from "./mod.ts";

function isDeferred(x): x is Deferred {
  return (
    typeof x === "object" &&
    x.promise instanceof Promise &&
    typeof x["resolve"] === "function" &&
    typeof x["reject"] === "function"
  );
}

test(async function asyncIsDeferred() {
  const d = defer();
  assert.assert(isDeferred(d));
  assert.assert(
    isDeferred({
      promise: null,
      resolve: () => {},
      reject: () => {}
    }) === false
  );
});
