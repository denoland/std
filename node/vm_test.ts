// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertThrows } from "../testing/asserts.ts";
import * as vm from "./vm.ts";

Deno.test("createScript", function () {
  const script = vm.createScript("foo", {});
  assert(script instanceof vm.Script);

  assertThrows(
    () => {
      script.runInContext({}, {});
    },
    Error,
    "Not implemented",
  );
  assertThrows(
    () => {
      script.runInNewContext({}, {});
    },
    Error,
    "Not implemented",
  );
  assertThrows(
    () => {
      script.createCachedData();
    },
    Error,
    "Not implemented",
  );
});

Deno.test({
  name: "APIs not yet implemented",
  fn() {
    assertThrows(
      () => {
        vm.createContext({}, {});
      },
      Error,
      "Not implemented",
    );
    assertThrows(
      () => {
        vm.runInContext("", {}, {});
      },
      Error,
      "Not implemented",
    );
    assertThrows(
      () => {
        vm.runInNewContext("", {}, {});
      },
      Error,
      "Not implemented",
    );
    assertThrows(
      () => {
        vm.isContext({});
      },
      Error,
      "Not implemented",
    );
    assertThrows(
      () => {
        vm.compileFunction("", {}, {});
      },
      Error,
      "Not implemented",
    );
    assertThrows(
      () => {
        vm.measureMemory({});
      },
      Error,
      "Not implemented",
    );
  },
});
