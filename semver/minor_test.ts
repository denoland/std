// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

Deno.test("minor", function () {
  // [range, version]
  // Version should be detectable despite extra characters
  const versions: [string, number][] = [
    ["1.1.3", 1],
    [" 1.1.3 ", 1],
    [" 1.2.3-4 ", 2],
    [" 1.3.3-pre ", 3],
    ["v1.5.3", 5],
    [" v1.8.3 ", 8],
    ["\t1.13.3", 13],
  ];

  versions.forEach(function (tuple) {
    const range = tuple[0];
    const version = tuple[1];
    const msg = `minor(${range}) = ${version}`;
    assertEquals(semver.minor(range), version, msg);
  });
});
