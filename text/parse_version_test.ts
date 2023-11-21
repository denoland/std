// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { parseVersion } from "./parse_version.ts";

Deno.test("basicParseVersion", function () {
  const version = "1.2.3";
  assertEquals(
    JSON.stringify([1, 2, 3]),
    JSON.stringify(parseVersion(version)),
  );
});

Deno.test("longParseVersion", function () {
  const version = "1.2.3.4.5.6";
  assertEquals(
    JSON.stringify([1, 2, 3, 4, 5, 6]),
    JSON.stringify(parseVersion(version)),
  );
});

Deno.test("shortParseVersion", function () {
  const version = "1";
  assertEquals(
    JSON.stringify([1]),
    JSON.stringify(parseVersion(version)),
  );
});

Deno.test("emptyParseVersion", function () {
  const version = "";
  assertEquals(
    JSON.stringify([]),
    JSON.stringify(parseVersion(version)),
  );
});

Deno.test("trailingStringParseVersion", function () {
  const version = "1.2.3.4beta";
  assertEquals(
    JSON.stringify([1, 2, 3, 4, "beta"]),
    JSON.stringify(parseVersion(version)),
  );
});

Deno.test("leadingStringParseVersion", function () {
  const version = "beta-1.2.3.4";
  assertEquals(
    JSON.stringify(["beta-", 1, 2, 3, 4]),
    JSON.stringify(parseVersion(version)),
  );
});

Deno.test("middleStringParseVersion", function () {
  const version = "1.2-beta3.4";
  assertEquals(
    JSON.stringify([1, 2, "-beta", 3, 4]),
    JSON.stringify(parseVersion(version)),
  );
});
