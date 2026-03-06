// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { common } from "./mod.ts";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";

Deno.test({
  name: "common() returns shared path",
  fn() {
    const actual = posix.common(
      [
        "file://deno/cli/js/deno.ts",
        "file://deno/std/path/mod.ts",
        "file://deno/cli/js/main.ts",
      ],
    );
    assertEquals(actual, "file://deno/");
  },
});

Deno.test({
  name: "common() returns empty string if no shared path is present",
  fn() {
    const actual = posix.common(
      ["file://deno/cli/js/deno.ts", "https://deno.land/std/path/mod.ts"],
    );
    assertEquals(actual, "");
  },
});

Deno.test({
  name: "common() checks windows separator",
  fn() {
    const actual = windows.common(
      [
        "c:\\deno\\cli\\js\\deno.ts",
        "c:\\deno\\std\\path\\mod.ts",
        "c:\\deno\\cli\\js\\main.ts",
      ],
    );
    assertEquals(actual, "c:\\deno\\");
  },
});

Deno.test({
  name: "common(['', '/'], '/') returns ''",
  fn() {
    const actual = posix.common(["", "/"]);
    assertEquals(actual, "");
  },
});

Deno.test({
  name: "common(['/', ''], '/') returns ''",
  fn() {
    const actual = posix.common([
      "/",
      "",
    ]);
    assertEquals(actual, "");
  },
});

Deno.test({
  name: "common() returns the first path unmodified when it's the only path",
  fn() {
    const actual = posix.common(["./deno/std/path/mod.ts"]);
    assertEquals(actual, "./deno/std/path/mod.ts");
  },
});

Deno.test({
  name: "common() returns the first path unmodified if all paths are equal",
  fn() {
    const actual = common(
      [
        "./deno/std/path/mod.ts",
        "./deno/std/path/mod.ts",
        "./deno/std/path/mod.ts",
      ],
    );
    assertEquals(actual, "./deno/std/path/mod.ts");
  },
});

Deno.test({
  name: "posix.common() returns shared path",
  fn() {
    const actual = posix.common(
      [
        "file://deno/cli/js/deno.ts",
        "file://deno/std/path/mod.ts",
        "file://deno/cli/js/main.ts",
      ],
    );
    assertEquals(actual, "file://deno/");
  },
});
