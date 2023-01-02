// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import * as JSONC from "../../../jsonc.ts";
import { assertEquals } from "../../../../testing/asserts.ts";

// reference: https://github.com/advisories/GHSA-9c47-m6qq-7p4h
// Check for prototype contamination using the source code included in the CVE-2022-46175.
// This test file is called from `/encoding/jsonc_test.ts`.

const jsonc = JSONC.parse('{"__proto__": { "isAdmin": true }}');
// @ts-expect-error: for test
assertEquals(jsonc.__proto__, { isAdmin: true });
// @ts-expect-error: for test
assertEquals(jsonc.isAdmin, undefined);
// @ts-expect-error: for test
assertEquals(Object.keys(jsonc), ["__proto__"]);
