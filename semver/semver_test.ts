import { assertEquals, assertThrows } from "../testing/asserts.ts";

import * as semver from "./mod.ts";

type Options = semver.Options | boolean;

Deno.test("invalidVersion", function (): void {
  const versions = ["1.2.3.4", "NOT VALID", 1.2, null, "Infinity.NaN.Infinity"];

  versions.forEach(function (v) {
    assertThrows(
      function () {
        new semver.SemVer(v as string);
      },
      TypeError,
      `Invalid Version: ${v}`,
    );
  });
});

Deno.test("maxSatisfying", function (): void {
  const versions: [string[], string, string, Options?][] = [
    [["1.2.3", "1.2.4"], "1.2", "1.2.4"],
    [["1.2.4", "1.2.3"], "1.2", "1.2.4"],
    [["1.2.3", "1.2.4", "1.2.5", "1.2.6"], "~1.2.3", "1.2.6"],
    [
      [
        "1.1.0",
        "1.2.0",
        "1.2.1",
        "1.3.0",
        "2.0.0b1",
        "2.0.0b2",
        "2.0.0b3",
        "2.0.0",
        "2.1.0",
      ],
      "~2.0.0",
      "2.0.0",
      true,
    ],
  ];

  versions.forEach(function (v) {
    const versions = v[0];
    const range = v[1];
    const expect = v[2];
    const loose = v[3];
    const actual = semver.maxSatisfying(versions, range, loose);
    assertEquals(actual, expect);
  });
});

Deno.test("minSatisfying", function (): void {
  const versions: [string[], string, string, Options?][] = [
    [["1.2.3", "1.2.4"], "1.2", "1.2.3"],
    [["1.2.4", "1.2.3"], "1.2", "1.2.3"],
    [["1.2.3", "1.2.4", "1.2.5", "1.2.6"], "~1.2.3", "1.2.3"],
    [
      [
        "1.1.0",
        "1.2.0",
        "1.2.1",
        "1.3.0",
        "2.0.0b1",
        "2.0.0b2",
        "2.0.0b3",
        "2.0.0",
        "2.1.0",
      ],
      "~2.0.0",
      "2.0.0",
      true,
    ],
  ];

  versions.forEach(function (v) {
    const versions = v[0];
    const range = v[1];
    const expect = v[2];
    const loose = v[3];
    const actual = semver.minSatisfying(versions, range, loose);
    assertEquals(actual, expect);
  });
});

Deno.test("outsideWithBadHiloThrows", function (): void {
  assertThrows(
    function () {
      semver.outside("1.2.3", ">1.5.0", "blerg" as ">", true);
    },
    TypeError,
    'Must provide a hilo val of "<" or ">"',
  );
});

Deno.test("sorting", function (): void {
  const list = ["1.2.3+1", "1.2.3+0", "1.2.3", "5.9.6", "0.1.2"];
  const sorted = ["0.1.2", "1.2.3", "1.2.3+0", "1.2.3+1", "5.9.6"];
  const rsorted = ["5.9.6", "1.2.3+1", "1.2.3+0", "1.2.3", "0.1.2"];
  assertEquals(semver.sort(list), sorted);
  assertEquals(semver.rsort(list), rsorted);
});

Deno.test("badRangesInMaxOrMinSatisfying", function (): void {
  const r = "some frogs and sneks-v2.5.6";
  assertEquals(semver.maxSatisfying([], r), null);
  assertEquals(semver.minSatisfying([], r), null);
});

Deno.test("bigNumericPrerelease", function (): void {
  const r = new semver.SemVer("1.2.3-beta." + Number.MAX_SAFE_INTEGER + "0");
  assertEquals(r.prerelease, ["beta", "90071992547409910"]);
});
