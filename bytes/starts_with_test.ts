// Copyright 2018-2026 the Deno authors. MIT license.
import { assert } from "@std/assert";
import { startsWith } from "./starts_with.ts";

Deno.test("startsWith()", async (t) => {
  await t.step("`true` where `source` and `prefix` are identical", () => {
    assert(startsWith(
      new Uint8Array([0, 1, 2, 3]),
      new Uint8Array([0, 1, 2, 3]),
    ));
  });
  await t.step("`true` where `source` starts with `prefix`", () => {
    assert(startsWith(
      new Uint8Array([0, 1, 2]),
      new Uint8Array([0, 1]),
    ));
  });
  await t.step("`false` with a common but only partial prefix", () => {
    assert(
      !startsWith(
        new Uint8Array([0, 1, 2]),
        new Uint8Array([0, 2]),
      ),
    );
  });
  await t.step("`false` where `prefix` is longer", () => {
    assert(
      !startsWith(
        new Uint8Array([0, 1, 2]),
        new Uint8Array([0, 2, 3, 4]),
      ),
    );
  });
  await t.step("`false` where `prefix` starts with `source`", () => {
    assert(
      !startsWith(
        new Uint8Array([0, 1]),
        new Uint8Array([0, 1, 2]),
      ),
    );
  });
});
