// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { test, runTests } from "../testing/mod.ts";
import {
  assert,
  AssertionError,
  assertStrictEq,
  assertThrowsAsync
} from "../testing/asserts.ts";
import { assertEquals } from "../testing/pretty.ts";
import { evaluate, instantiate, load, ModuleMetaData } from "./utils.ts";

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace globalThis {
    var __results: string | undefined;
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

const fixture = `
define("modB", ["require", "exports"], function(require, exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.foo = "bar";
});
define("modA", ["require", "exports", "modB"], function(require, exports, modB) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  globalThis.__results = modB.foo;
});
`;

const fixtureQueue = ["modB", "modA"];
const fixtureModules = new Map<string, ModuleMetaData>();
fixtureModules.set("modB", {
  dependencies: ["require", "exports"],
  factory(_require, exports): void {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.foo = "bar";
  },
  exports: {}
});
fixtureModules.set("modA", {
  dependencies: ["require", "exports", "modB"],
  factory(_require, exports, modB): void {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    globalThis.__results = modB.foo;
  },
  exports: {}
});

test(async function loadBundle() {
  const result = await load(["", "./bundle/testdata/bundle.js"]);
  assert(result != null);
  assert(
    result.includes(
      `define("subdir/print_hello", ["require", "exports"], function(`
    )
  );
});

test(async function loadBadArgs() {
  await assertThrowsAsync(
    async () => {
      await load(["bundle/test.ts"]);
    },
    AssertionError,
    "Expected exactly two arguments."
  );
});

test(async function loadMissingBundle() {
  await assertThrowsAsync(
    async () => {
      await load([".", "bad_bundle.js"]);
    },
    AssertionError,
    `Expected "bad_bundle.js" to exist.`
  );
});

test(async function evaluateBundle() {
  assert(globalThis.define == null, "Expected 'define' to be undefined");
  const [queue, modules] = evaluate(fixture);
  assert(globalThis.define == null, "Expected 'define' to be undefined");
  assertEquals(queue, ["modB", "modA"]);
  assert(modules.has("modA"));
  assert(modules.has("modB"));
  assertStrictEq(modules.size, 2);
});

test(async function instantiateBundle() {
  assert(globalThis.__results == null);
  instantiate(fixtureQueue, fixtureModules);
  assertEquals(globalThis.__results, "bar");
  delete globalThis.__results;
});
