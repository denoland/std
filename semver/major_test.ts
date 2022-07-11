import { assertEquals } from "../testing/asserts.ts";

import * as semver from "./mod.ts";

Deno.test("major", function (): void {
  // [range, version, loose]
  // Version should be detectable despite extra characters
  const versions: [string, number, boolean?][] = [
    ["1.2.3", 1],
    [" 1.2.3 ", 1],
    [" 2.2.3-4 ", 2],
    [" 3.2.3-pre ", 3],
    ["v5.2.3", 5],
    [" v8.2.3 ", 8],
    ["\t13.2.3", 13],
    ["=21.2.3", 21, true],
    ["v=34.2.3", 34, true],
  ];

  versions.forEach(function (tuple) {
    const range = tuple[0];
    const version = tuple[1];
    const loose = tuple[2] || false;
    const msg = `major(${range}, ${loose}) = ${version}`;
    assertEquals(semver.major(range, loose), version, msg);
  });
});
