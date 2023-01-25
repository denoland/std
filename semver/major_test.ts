// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

Deno.test("major", function () {
  // [range, version]
  // Version should be detectable despite extra characters
  const versions: [string, number][] = [
    ["1.2.3", 1],
    [" 1.2.3 ", 1],
    [" 2.2.3-4 ", 2],
    [" 3.2.3-pre ", 3],
    ["v5.2.3", 5],
    [" v8.2.3 ", 8],
    ["\t13.2.3", 13],
  ];

  versions.forEach(function (tuple) {
    const range = tuple[0];
    const version = tuple[1];
    const msg = `major(${range}) = ${version}`;
    assertEquals(semver.major(range), version, msg);
  });
});
