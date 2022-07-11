import { assert, assertEquals, assertThrows } from "../testing/asserts.ts";

import * as semver from "./mod.ts";

type Version = string;
type Options = semver.Options | boolean;

Deno.test("range", function (): void {
  // [range, version]
  // version should be included by range
  const versions: [Version, Version, Options?][] = [
    ["1.0.0 - 2.0.0", "1.2.3"],
    ["^1.2.3+build", "1.2.3"],
    ["^1.2.3+build", "1.3.0"],
    ["1.2.3-pre+asdf - 2.4.3-pre+asdf", "1.2.3"],
    ["1.2.3pre+asdf - 2.4.3-pre+asdf", "1.2.3", true],
    ["1.2.3-pre+asdf - 2.4.3pre+asdf", "1.2.3", true],
    ["1.2.3pre+asdf - 2.4.3pre+asdf", "1.2.3", true],
    ["1.2.3-pre+asdf - 2.4.3-pre+asdf", "1.2.3-pre.2"],
    ["1.2.3-pre+asdf - 2.4.3-pre+asdf", "2.4.3-alpha"],
    ["1.2.3+asdf - 2.4.3+asdf", "1.2.3"],
    ["1.0.0", "1.0.0"],
    [">=*", "0.2.4"],
    ["", "1.0.0"],
    ["*", "1.2.3", {}],
    ["*", "v1.2.3", { loose: 123 } as unknown as Options],
    [">=1.0.0", "1.0.0", /asdf/ as unknown as Options],
    [">=1.0.0", "1.0.1", { loose: null! }],
    [">=1.0.0", "1.1.0", { loose: 0 as unknown as boolean }],
    [">1.0.0", "1.0.1", { loose: undefined }],
    [">1.0.0", "1.1.0"],
    ["<=2.0.0", "2.0.0"],
    ["<=2.0.0", "1.9999.9999"],
    ["<=2.0.0", "0.2.9"],
    ["<2.0.0", "1.9999.9999"],
    ["<2.0.0", "0.2.9"],
    [">= 1.0.0", "1.0.0"],
    [">=  1.0.0", "1.0.1"],
    [">=   1.0.0", "1.1.0"],
    ["> 1.0.0", "1.0.1"],
    [">  1.0.0", "1.1.0"],
    ["<=   2.0.0", "2.0.0"],
    ["<= 2.0.0", "1.9999.9999"],
    ["<=  2.0.0", "0.2.9"],
    ["<    2.0.0", "1.9999.9999"],
    ["<\t2.0.0", "0.2.9"],
    [">=0.1.97", "v0.1.97", true],
    [">=0.1.97", "0.1.97"],
    ["0.1.20 || 1.2.4", "1.2.4"],
    [">=0.2.3 || <0.0.1", "0.0.0"],
    [">=0.2.3 || <0.0.1", "0.2.3"],
    [">=0.2.3 || <0.0.1", "0.2.4"],
    ["||", "1.3.4"],
    ["2.x.x", "2.1.3"],
    ["1.2.x", "1.2.3"],
    ["1.2.x || 2.x", "2.1.3"],
    ["1.2.x || 2.x", "1.2.3"],
    ["x", "1.2.3"],
    ["2.*.*", "2.1.3"],
    ["1.2.*", "1.2.3"],
    ["1.2.* || 2.*", "2.1.3"],
    ["1.2.* || 2.*", "1.2.3"],
    ["*", "1.2.3"],
    ["2", "2.1.2"],
    ["2.3", "2.3.1"],
    ["~0.0.1", "0.0.1"],
    ["~0.0.1", "0.0.2"],
    ["~x", "0.0.9"], // >=2.4.0 <2.5.0
    ["~2", "2.0.9"], // >=2.4.0 <2.5.0
    ["~2.4", "2.4.0"], // >=2.4.0 <2.5.0
    ["~2.4", "2.4.5"],
    ["~>3.2.1", "3.2.2"], // >=3.2.1 <3.3.0,
    ["~1", "1.2.3"], // >=1.0.0 <2.0.0
    ["~>1", "1.2.3"],
    ["~> 1", "1.2.3"],
    ["~1.0", "1.0.2"], // >=1.0.0 <1.1.0,
    ["~ 1.0", "1.0.2"],
    ["~ 1.0.3", "1.0.12"],
    ["~ 1.0.3alpha", "1.0.12", { loose: true }],
    [">=1", "1.0.0"],
    [">= 1", "1.0.0"],
    ["<1.2", "1.1.1"],
    ["< 1.2", "1.1.1"],
    ["~v0.5.4-pre", "0.5.5"],
    ["~v0.5.4-pre", "0.5.4"],
    ["=0.7.x", "0.7.2"],
    ["<=0.7.x", "0.7.2"],
    [">=0.7.x", "0.7.2"],
    ["<=0.7.x", "0.6.2"],
    ["~1.2.1 >=1.2.3", "1.2.3"],
    ["~1.2.1 =1.2.3", "1.2.3"],
    ["~1.2.1 1.2.3", "1.2.3"],
    ["~1.2.1 >=1.2.3 1.2.3", "1.2.3"],
    ["~1.2.1 1.2.3 >=1.2.3", "1.2.3"],
    ["~1.2.1 1.2.3", "1.2.3"],
    [">=1.2.1 1.2.3", "1.2.3"],
    ["1.2.3 >=1.2.1", "1.2.3"],
    [">=1.2.3 >=1.2.1", "1.2.3"],
    [">=1.2.1 >=1.2.3", "1.2.3"],
    [">=1.2", "1.2.8"],
    ["^1.2.3", "1.8.1"],
    ["^0.1.2", "0.1.2"],
    ["^0.1", "0.1.2"],
    ["^0.0.1", "0.0.1"],
    ["^1.2", "1.4.2"],
    ["^1.2 ^1", "1.4.2"],
    ["^1.2.3-alpha", "1.2.3-pre"],
    ["^1.2.0-alpha", "1.2.0-pre"],
    ["^0.0.1-alpha", "0.0.1-beta"],
    ["^0.0.1-alpha", "0.0.1"],
    ["^0.1.1-alpha", "0.1.1-beta"],
    ["^x", "1.2.3"],
    ["x - 1.0.0", "0.9.7"],
    ["x - 1.x", "0.9.7"],
    ["1.0.0 - x", "1.9.7"],
    ["1.x - x", "1.9.7"],
    ["<=7.x", "7.9.9"],
  ];

  versions.forEach(function (v) {
    const range = v[0];
    const ver = v[1];
    const loose = v[2];
    assert(semver.satisfies(ver, range, loose), range + " satisfied by " + ver);
  });
});

Deno.test("negativeRange", function (): void {
  // [range, version]
  // version should not be included by range
  const versions: [Version, Version, Options?][] = [
    ["1.0.0 - 2.0.0", "2.2.3"],
    ["1.2.3+asdf - 2.4.3+asdf", "1.2.3-pre.2"],
    ["1.2.3+asdf - 2.4.3+asdf", "2.4.3-alpha"],
    ["^1.2.3+build", "2.0.0"],
    ["^1.2.3+build", "1.2.0"],
    ["^1.2.3", "1.2.3-pre"],
    ["^1.2", "1.2.0-pre"],
    [">1.2", "1.3.0-beta"],
    ["<=1.2.3", "1.2.3-beta"],
    ["^1.2.3", "1.2.3-beta"],
    ["=0.7.x", "0.7.0-asdf"],
    [">=0.7.x", "0.7.0-asdf"],
    ["1", "1.0.0beta", { loose: 420 } as unknown as Options],
    ["<1", "1.0.0beta", true],
    ["< 1", "1.0.0beta", true],
    ["1.0.0", "1.0.1"],
    [">=1.0.0", "0.0.0"],
    [">=1.0.0", "0.0.1"],
    [">=1.0.0", "0.1.0"],
    [">1.0.0", "0.0.1"],
    [">1.0.0", "0.1.0"],
    ["<=2.0.0", "3.0.0"],
    ["<=2.0.0", "2.9999.9999"],
    ["<=2.0.0", "2.2.9"],
    ["<2.0.0", "2.9999.9999"],
    ["<2.0.0", "2.2.9"],
    [">=0.1.97", "v0.1.93", true],
    [">=0.1.97", "0.1.93"],
    ["0.1.20 || 1.2.4", "1.2.3"],
    [">=0.2.3 || <0.0.1", "0.0.3"],
    [">=0.2.3 || <0.0.1", "0.2.2"],
    ["2.x.x", "1.1.3", { loose: NaN as unknown as boolean }],
    ["2.x.x", "3.1.3"],
    ["1.2.x", "1.3.3"],
    ["1.2.x || 2.x", "3.1.3"],
    ["1.2.x || 2.x", "1.1.3"],
    ["2.*.*", "1.1.3"],
    ["2.*.*", "3.1.3"],
    ["1.2.*", "1.3.3"],
    ["1.2.* || 2.*", "3.1.3"],
    ["1.2.* || 2.*", "1.1.3"],
    ["2", "1.1.2"],
    ["2.3", "2.4.1"],
    ["~0.0.1", "0.1.0-alpha"],
    ["~0.0.1", "0.1.0"],
    ["~2.4", "2.5.0"], // >=2.4.0 <2.5.0
    ["~2.4", "2.3.9"],
    ["~>3.2.1", "3.3.2"], // >=3.2.1 <3.3.0
    ["~>3.2.1", "3.2.0"], // >=3.2.1 <3.3.0
    ["~1", "0.2.3"], // >=1.0.0 <2.0.0
    ["~>1", "2.2.3"],
    ["~1.0", "1.1.0"], // >=1.0.0 <1.1.0
    ["<1", "1.0.0"],
    [">=1.2", "1.1.1"],
    ["1", "2.0.0beta", true],
    ["~v0.5.4-beta", "0.5.4-alpha"],
    ["=0.7.x", "0.8.2"],
    [">=0.7.x", "0.6.2"],
    ["<0.7.x", "0.7.2"],
    ["<1.2.3", "1.2.3-beta"],
    ["=1.2.3", "1.2.3-beta"],
    [">1.2", "1.2.8"],
    ["^0.0.1", "0.0.2-alpha"],
    ["^0.0.1", "0.0.2"],
    ["^1.2.3", "2.0.0-alpha"],
    ["^1.2.3", "1.2.2"],
    ["^1.2", "1.1.9"],
    ["*", "v1.2.3-foo", true],
    // invalid ranges never satisfied!
    ["blerg", "1.2.3"],
    ["git+https://user:password0123@github.com/foo", "123.0.0", true],
    ["^1.2.3", "2.0.0-pre"],
  ];

  versions.forEach(function (v) {
    const range = v[0];
    const ver = v[1];
    const loose = v[2];
    const found = semver.satisfies(ver, range, loose);
    assert(!found, ver + " not satisfied by " + range);
  });
});

Deno.test("unlockedPrereleaseRange", function (): void {
  // [range, version]
  // version should be included by range
  const versions: [Version, Version][] = [
    ["*", "1.0.0-rc1"],
    ["^1.0.0", "2.0.0-rc1"],
    ["^1.0.0-0", "1.0.1-rc1"],
    ["^1.0.0-rc2", "1.0.1-rc1"],
    ["^1.0.0", "1.0.1-rc1"],
    ["^1.0.0", "1.1.0-rc1"],
  ];

  versions.forEach(function (v) {
    const range = v[0];
    const ver = v[1];
    const options = { includePrerelease: true };
    assert(
      semver.satisfies(ver, range, options),
      range + " satisfied by " + ver,
    );
  });
});

Deno.test("negativeUnlockedPrereleaseRange", function (): void {
  // [range, version]
  // version should be included by range
  const versions: [Version, Version][] = [
    ["^1.0.0", "1.0.0-rc1"],
    ["^1.2.3-rc2", "2.0.0"],
  ];

  versions.forEach(function (v) {
    const range = v[0];
    const ver = v[1];
    const options = { includePrerelease: true };
    const found = semver.satisfies(ver, range, options);
    assert(!found, ver + " not satisfied by " + range);
  });
});

Deno.test("validRange", function (): void {
  // [range, result]
  // validRange(range) -> result
  // translate ranges into their canonical form
  const versions: [Version | null, Version | null, Options?][] = [
    ["1.0.0 - 2.0.0", ">=1.0.0 <=2.0.0"],
    ["1.0.0", "1.0.0"],
    [">=*", "*"],
    ["", "*"],
    ["*", "*"],
    ["*", "*"],
    [">=1.0.0", ">=1.0.0"],
    [">1.0.0", ">1.0.0"],
    ["<=2.0.0", "<=2.0.0"],
    ["1", ">=1.0.0 <2.0.0"],
    ["<=2.0.0", "<=2.0.0"],
    ["<=2.0.0", "<=2.0.0"],
    ["<2.0.0", "<2.0.0"],
    ["<2.0.0", "<2.0.0"],
    [">= 1.0.0", ">=1.0.0"],
    [">=  1.0.0", ">=1.0.0"],
    [">=   1.0.0", ">=1.0.0"],
    ["> 1.0.0", ">1.0.0"],
    [">  1.0.0", ">1.0.0"],
    ["<=   2.0.0", "<=2.0.0"],
    ["<= 2.0.0", "<=2.0.0"],
    ["<=  2.0.0", "<=2.0.0"],
    ["<    2.0.0", "<2.0.0"],
    ["<\t2.0.0", "<2.0.0"],
    [">=0.1.97", ">=0.1.97"],
    [">=0.1.97", ">=0.1.97"],
    ["0.1.20 || 1.2.4", "0.1.20||1.2.4"],
    [">=0.2.3 || <0.0.1", ">=0.2.3||<0.0.1"],
    [">=0.2.3 || <0.0.1", ">=0.2.3||<0.0.1"],
    [">=0.2.3 || <0.0.1", ">=0.2.3||<0.0.1"],
    ["||", "||"],
    ["2.x.x", ">=2.0.0 <3.0.0"],
    ["1.2.x", ">=1.2.0 <1.3.0"],
    ["1.2.x || 2.x", ">=1.2.0 <1.3.0||>=2.0.0 <3.0.0"],
    ["1.2.x || 2.x", ">=1.2.0 <1.3.0||>=2.0.0 <3.0.0"],
    ["x", "*"],
    ["2.*.*", ">=2.0.0 <3.0.0"],
    ["1.2.*", ">=1.2.0 <1.3.0"],
    ["1.2.* || 2.*", ">=1.2.0 <1.3.0||>=2.0.0 <3.0.0"],
    ["*", "*"],
    ["2", ">=2.0.0 <3.0.0"],
    ["2.3", ">=2.3.0 <2.4.0"],
    ["~2.4", ">=2.4.0 <2.5.0"],
    ["~2.4", ">=2.4.0 <2.5.0"],
    ["~>3.2.1", ">=3.2.1 <3.3.0"],
    ["~1", ">=1.0.0 <2.0.0"],
    ["~>1", ">=1.0.0 <2.0.0"],
    ["~> 1", ">=1.0.0 <2.0.0"],
    ["~1.0", ">=1.0.0 <1.1.0"],
    ["~ 1.0", ">=1.0.0 <1.1.0"],
    ["^0", ">=0.0.0 <1.0.0"],
    ["^ 1", ">=1.0.0 <2.0.0"],
    ["^0.1", ">=0.1.0 <0.2.0"],
    ["^1.0", ">=1.0.0 <2.0.0"],
    ["^1.2", ">=1.2.0 <2.0.0"],
    ["^0.0.1", ">=0.0.1 <0.0.2"],
    ["^0.0.1-beta", ">=0.0.1-beta <0.0.2"],
    ["^0.1.2", ">=0.1.2 <0.2.0"],
    ["^1.2.3", ">=1.2.3 <2.0.0"],
    ["^1.2.3-beta.4", ">=1.2.3-beta.4 <2.0.0"],
    ["<1", "<1.0.0"],
    ["< 1", "<1.0.0"],
    [">=1", ">=1.0.0"],
    [">= 1", ">=1.0.0"],
    ["<1.2", "<1.2.0"],
    ["< 1.2", "<1.2.0"],
    ["1", ">=1.0.0 <2.0.0"],
    [">01.02.03", ">1.2.3", true],
    [">01.02.03", null],
    ["~1.2.3beta", ">=1.2.3-beta <1.3.0", true],
    ["~1.2.3beta", null],
    ["^ 1.2 ^ 1", ">=1.2.0 <2.0.0 >=1.0.0 <2.0.0"],
  ];

  versions.forEach(function (v) {
    const pre = v[0];
    const wanted = v[1];
    const loose = v[2];
    const found = semver.validRange(pre, loose);
    assertEquals(found, wanted, "validRange(" + pre + ") === " + wanted);
  });
});

Deno.test("strictVsLoose", function (): void {
  const versions: [Version, Version][] = [
    [">=01.02.03", ">=1.2.3"],
    ["~1.02.03beta", ">=1.2.3-beta <1.3.0"],
  ];

  versions.forEach(function (v) {
    const loose = v[0];
    const comps = v[1];
    assertThrows(function () {
      new semver.Range(loose);
    });
    assertEquals(new semver.Range(loose, true).range, comps);
  });
});

Deno.test("missingRangeParameterInRangeIntersect", function (): void {
  assertThrows(
    function () {
      new semver.Range("1.0.0").intersects(undefined);
    },
    TypeError,
    "a Range is required",
  );
});

Deno.test("tostrings", function (): void {
  assertEquals(new semver.Range(">= v1.2.3").toString(), ">=1.2.3");
});

Deno.test("rangesIntersect", function (): void {
  const versions: [string, string, boolean][] = [
    ["1.3.0 || <1.0.0 >2.0.0", "1.3.0 || <1.0.0 >2.0.0", true],
    ["<1.0.0 >2.0.0", ">0.0.0", false],
    [">0.0.0", "<1.0.0 >2.0.0", false],
    ["<1.0.0 >2.0.0", ">1.4.0 <1.6.0", false],
    ["<1.0.0 >2.0.0", ">1.4.0 <1.6.0 || 2.0.0", false],
    [">1.0.0 <=2.0.0", "2.0.0", true],
    ["<1.0.0 >=2.0.0", "2.1.0", false],
    ["<1.0.0 >=2.0.0", ">1.4.0 <1.6.0 || 2.0.0", false],
    ["1.5.x", "<1.5.0 || >=1.6.0", false],
    ["<1.5.0 || >=1.6.0", "1.5.x", false],
    [
      "<1.6.16 || >=1.7.0 <1.7.11 || >=1.8.0 <1.8.2",
      ">=1.6.16 <1.7.0 || >=1.7.11 <1.8.0 || >=1.8.2",
      false,
    ],
    [
      "<=1.6.16 || >=1.7.0 <1.7.11 || >=1.8.0 <1.8.2",
      ">=1.6.16 <1.7.0 || >=1.7.11 <1.8.0 || >=1.8.2",
      true,
    ],
    [">=1.0.0", "<=1.0.0", true],
    [">1.0.0 <1.0.0", "<=0.0.0", false],
    ["*", "0.0.1", true],
    ["*", ">=1.0.0", true],
    ["*", ">1.0.0", true],
    ["*", "~1.0.0", true],
    ["*", "<1.6.0", true],
    ["*", "<=1.6.0", true],
    ["1.*", "0.0.1", false],
    ["1.*", "2.0.0", false],
    ["1.*", "1.0.0", true],
    ["1.*", "<2.0.0", true],
    ["1.*", ">1.0.0", true],
    ["1.*", "<=1.0.0", true],
    ["1.*", "^1.0.0", true],
    ["1.0.*", "0.0.1", false],
    ["1.0.*", "<0.0.1", false],
    ["1.0.*", ">0.0.1", true],
    ["*", "1.3.0 || <1.0.0 >2.0.0", true],
    ["1.3.0 || <1.0.0 >2.0.0", "*", true],
    ["1.*", "1.3.0 || <1.0.0 >2.0.0", true],
    ["x", "0.0.1", true],
    ["x", ">=1.0.0", true],
    ["x", ">1.0.0", true],
    ["x", "~1.0.0", true],
    ["x", "<1.6.0", true],
    ["x", "<=1.6.0", true],
    ["1.x", "0.0.1", false],
    ["1.x", "2.0.0", false],
    ["1.x", "1.0.0", true],
    ["1.x", "<2.0.0", true],
    ["1.x", ">1.0.0", true],
    ["1.x", "<=1.0.0", true],
    ["1.x", "^1.0.0", true],
    ["1.0.x", "0.0.1", false],
    ["1.0.x", "<0.0.1", false],
    ["1.0.x", ">0.0.1", true],
    ["x", "1.3.0 || <1.0.0 >2.0.0", true],
    ["1.3.0 || <1.0.0 >2.0.0", "x", true],
    ["1.x", "1.3.0 || <1.0.0 >2.0.0", true],
    ["*", "*", true],
    ["x", "", true],
  ];

  versions.forEach(function (v) {
    const range1 = new semver.Range(v[0]);
    const range2 = new semver.Range(v[1]);
    const expect = v[2];
    const actual1 = range1.intersects(range2);
    const actual2 = range2.intersects(range1);
    const actual3 = semver.intersects(v[1], v[0]);
    const actual4 = semver.intersects(v[0], v[1]);
    const actual5 = semver.intersects(v[1], v[0], true);
    const actual6 = semver.intersects(v[0], v[1], true);
    const actual7 = semver.intersects(range1, range2);
    const actual8 = semver.intersects(range2, range1);
    const actual9 = semver.intersects(range1, range2, true);
    const actual0 = semver.intersects(range2, range1, true);
    assertEquals(actual1, expect);
    assertEquals(actual2, expect);
    assertEquals(actual3, expect);
    assertEquals(actual4, expect);
    assertEquals(actual5, expect);
    assertEquals(actual6, expect);
    assertEquals(actual7, expect);
    assertEquals(actual8, expect);
    assertEquals(actual9, expect);
    assertEquals(actual0, expect);
  });
});
