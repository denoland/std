// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

Deno.test("patch", function (): void {
  // [range, version, loose]
  // Version should be detectable despite extra characters
  const versions: [string, number, boolean?][] = [
    ["1.2.1", 1],
    [" 1.2.1 ", 1],
    [" 1.2.2-4 ", 2],
    [" 1.2.3-pre ", 3],
    ["v1.2.5", 5],
    [" v1.2.8 ", 8],
    ["\t1.2.13", 13],
    ["=1.2.21", 21, true],
    ["v=1.2.34", 34, true],
  ];

  versions.forEach(function (tuple) {
    const range = tuple[0];
    const version = tuple[1];
    const loose = tuple[2] || false;
    const msg = `patch(${range}, ${loose}) = ${version}`;
    assertEquals(semver.patch(range, loose), version, msg);
  });
});
