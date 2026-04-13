// Copyright 2018-2026 the Deno authors. MIT license.
import { assert } from "@std/assert";
import { ANY } from "./_constants.ts";
import { isSemVer } from "./is_semver.ts";

Deno.test({
  name: "isSemVer() handles invalid input",
  fn: async (t) => {
    const versions: [unknown][] = [
      [null],
      [undefined],
      [{}],
      [[]],
      [true],
      [false],
      [0],
      ["1.2.3"],
      [{ major: 0, minor: 0, build: [], prerelease: [] }],
      [{ major: 0, patch: 0, build: [], prerelease: [] }],
      [{ minor: 0, patch: 0, build: [], prerelease: [] }],
      [{ major: "", minor: 0, patch: 0, build: [], prerelease: [] }],
      [{ major: 0, minor: "", patch: 0, build: [], prerelease: [] }],
      [{ major: 0, minor: 0, patch: "", build: [], prerelease: [] }],
      [{ major: 0, minor: 0, patch: 0, build: {}, prerelease: [] }],
      [{ major: 0, minor: 0, patch: 0, build: [], prerelease: {} }],
      [{ major: 0, minor: 0, patch: 0, build: [{}], prerelease: [] }],
      [{ major: 0, minor: 0, patch: 0, build: [], prerelease: [{}] }],
      [{ major: 0, minor: 0, patch: 0, build: [""], prerelease: [] }],
      [{ major: 0, minor: 0, patch: 0, build: [], prerelease: [""] }],
      [{ major: 0, minor: 0, patch: 0, build: [], prerelease: [-1] }],
      [{ major: 0, minor: 0, patch: 0, build: [], prerelease: [Number.NaN] }],
    ];
    for (const [v] of versions) {
      await t.step(`${Deno.inspect(v)}`, () => {
        const actual = isSemVer(v);
        assert(!actual);
      });
    }
  },
});

Deno.test({
  name: "isSemVer()",
  fn: async (t) => {
    const versions: [unknown][] = [
      [{ major: 0, minor: 0, patch: 0 }],
      [{ major: 0, minor: 0, patch: 0, prerelease: [] }],
      [{ major: 0, minor: 0, patch: 0, build: [] }],
      [{ major: 0, minor: 0, patch: 0, prerelease: undefined }],
      [{ major: 0, minor: 0, patch: 0, build: undefined }],
      [{
        major: 0,
        minor: 0,
        patch: 0,
        prerelease: undefined,
        build: undefined,
      }],
      [{ major: 0, minor: 0, patch: 0, build: [], prerelease: [] }],
      [{ extra: 1, major: 0, minor: 0, patch: 0, build: [], prerelease: [] }],
      [{ major: 0, minor: 0, patch: 0, build: ["abc"], prerelease: [] }],
      [{ major: 0, minor: 0, patch: 0, build: [], prerelease: ["abc"] }],
      [{ major: 0, minor: 0, patch: 0, build: [], prerelease: ["abc", 0] }],

      [ANY],
    ];
    for (const [v] of versions) {
      await t.step(
        `${Deno.inspect(v)}`,
        () => {
          const actual = isSemVer(v);
          assert(actual);
        },
      );
    }
  },
});
