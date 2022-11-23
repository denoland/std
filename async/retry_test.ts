// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { retry } from "./retry.ts";
import { assert, assertRejects } from "../testing/asserts.ts";

function generateErroringFunction(errorsBeforeSucceeds: number) {
  let errorCount = 0;

  return () => {
    if (errorCount >= errorsBeforeSucceeds) {
      return errorCount;
    }
    errorCount++;
    throw `Only errored ${errorCount} times`;
  };
}

Deno.test("[async] retry", async function () {
  const threeErrors = generateErroringFunction(3);
  const result = await retry(threeErrors, {
    minTimeout: 100,
  });
  assert(result === 3);
});

Deno.test("[async] retry fails after max is passed", async function () {
  const fiveErrors = generateErroringFunction(5);
  await assertRejects(() =>
    retry(fiveErrors, {
      minTimeout: 100,
    })
  );
});
