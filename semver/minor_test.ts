import { assertEquals } from "../testing/asserts.ts";

import * as semver from "./mod.ts";

Deno.test("minor", function (): void {
  // [range, version, loose]
  // Version should be detectable despite extra characters
  const versions: [string, number, boolean?][] = [
    ["1.1.3", 1],
    [" 1.1.3 ", 1],
    [" 1.2.3-4 ", 2],
    [" 1.3.3-pre ", 3],
    ["v1.5.3", 5],
    [" v1.8.3 ", 8],
    ["\t1.13.3", 13],
    ["=1.21.3", 21, true],
    ["v=1.34.3", 34, true],
  ];

  versions.forEach(function (tuple) {
    const range = tuple[0];
    const version = tuple[1];
    const loose = tuple[2] || false;
    const msg = `minor(${range}, ${loose}) = ${version}`;
    assertEquals(semver.minor(range, loose), version, msg);
  });
});
