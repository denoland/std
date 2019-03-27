// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { runTests, test } from "./mod.ts";
import { assert } from "./asserts.ts";

function genTest(options) {
  let n = options.parallel ? "parallel" : "serial";
  test({
    name: `[RunTests ${n}] run Test 1`,
    fn() {
      assert(true);
    }
  });

  test({
    name: `[RunTests ${n}] run Test 2`,
    fn() {
      assert(true);
    }
  });
}
async function testTheTestRunner() {
  let opt = { parallel: false };
  genTest(opt);
  await runTests(opt);
  opt = { parallel: true };
  genTest(opt);
  await runTests(opt);
}

runTests().then(() => {
  testTheTestRunner();
});
