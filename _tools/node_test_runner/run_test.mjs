// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { test } from "node:test";

import "../../collections/aggregate_groups_test.ts";
import "../../collections/associate_by_test.ts";
import "../../collections/associate_with_test.ts";

for (const testDef of testDefinitions) {
  test(testDef.name, testDef.fn);
}
