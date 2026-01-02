// Copyright 2018-2026 the Deno authors. MIT license.
import { assert } from "@std/assert";
import { endsWith } from "./ends_with.ts";

Deno.test("endsWith()", async (t) => {
  await t.step("`true` where `source` and `suffix` are identical", () => {
    assert(endsWith(
      new Uint8Array([0, 1, 2, 3]),
      new Uint8Array([0, 1, 2, 3]),
    ));
  });
  await t.step("`true` where `source` ends with `suffix`", () => {
    assert(endsWith(
      new Uint8Array([0, 1, 2]),
      new Uint8Array([1, 2]),
    ));
  });
  await t.step("`false` with a common but only partial suffix", () => {
    assert(
      !endsWith(
        new Uint8Array([0, 1, 2]),
        new Uint8Array([0, 2]),
      ),
    );
  });
  await t.step("`false` where `suffix` is longer", () => {
    assert(
      !endsWith(
        new Uint8Array([0, 1, 2]),
        new Uint8Array([0, 2, 3, 4]),
      ),
    );
  });
  await t.step("`false` where `suffix` ends with `source`", () => {
    assert(
      !endsWith(
        new Uint8Array([1, 2]),
        new Uint8Array([0, 1, 2]),
      ),
    );
  });
});
