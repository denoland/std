import { assertEquals } from "../testing/asserts.ts";

import * as semver from "./mod.ts";

Deno.test("clean", function (): void {
  // [range, version]
  // Version should be detectable despite extra characters
  const versions: [string, string | null][] = [
    ["1.2.3", "1.2.3"],
    [" 1.2.3 ", "1.2.3"],
    [" 1.2.3-4 ", "1.2.3-4"],
    [" 1.2.3-pre ", "1.2.3-pre"],
    ["  =v1.2.3   ", "1.2.3"],
    ["v1.2.3", "1.2.3"],
    [" v1.2.3 ", "1.2.3"],
    ["\t1.2.3", "1.2.3"],
    [">1.2.3", null],
    ["~1.2.3", null],
    ["<=1.2.3", null],
    ["1.2.x", null],
  ];

  versions.forEach(function (tuple) {
    const range: string = tuple[0];
    const version: string | null = tuple[1];
    const msg = `clean(${range})=${version}`;
    assertEquals(semver.clean(range), version, msg);
  });
});
