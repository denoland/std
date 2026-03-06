// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertFalse, assertThrows } from "@std/assert";

import { type Format, test } from "./test.ts";

Deno.test("test() tests for unknown format", () => {
  assertThrows(
    () => test("foo", ["unknown"] as unknown as Format[]),
    TypeError,
    "Unable to test for unknown front matter format",
  );
});

Deno.test("test() handles valid yaml input", () => {
  assert(test("---yaml\nname = 'deno'\n---\n"));
  assert(test("= yaml =\nname = 'deno'\n= yaml =\n"));
  assert(test("= yaml =\nname = 'deno'\n= yaml =\ndeno is awesome\n"));
  assert(test("---\nname: deno\n---\n"));
});

Deno.test("test() handles invalid yaml input", () => {
  assert(!test(""));
  assert(!test("---"));
  assert(!test("---yaml"));
  assert(!test("= yaml ="));
  assert(!test("---\n"));
  assert(!test("---yaml\n"));
  assert(!test("= yaml =\n"));
  assert(!test("---\nasdasdasd"));
});

Deno.test({
  name: "test() handles yaml text between horizontal rules",
  fn() {
    const str = `# Project title

---

This is a test for issue #2595

- **Author:** The Deno Authors
- **Version:** 0.1.0
- **License:** MIT

---

MIT License`;

    assert(!test(str));
  },
});

Deno.test("test() handles valid json input", () => {
  assert(test("---json\nname = 'deno'\n---\n"));
  assert(test("= json =\nname = 'deno'\n= json =\n"));
  assert(test("= json =\nname = 'deno'\n= json =\ndeno is awesome\n"));
});

Deno.test("test() handles invalid json input", () => {
  assert(!test(""));
  assert(!test("---"));
  assert(!test("---json"));
  assert(!test("= json ="));
  assert(!test("---\n"));
  assert(!test("---json\n"));
  assert(!test("= json =\n"));
  assert(!test("---\nasdasdasd"));
});

Deno.test("test() handles valid toml input", () => {
  assert(test("---toml\nname = 'deno'\n---\n"));
  assert(test("= toml =\nname = 'deno'\n= toml =\n"));
  assert(test("= toml =\nname = 'deno'\n= toml =\ndeno is awesome\n"));
});

Deno.test("test() handles invalid toml input", () => {
  assert(!test(""));
  assert(!test("---"));
  assert(!test("---toml"));
  assert(!test("= toml ="));
  assert(!test("---\n"));
  assert(!test("---toml\n"));
  assert(!test("= toml =\n"));
  assert(!test("---\nasdasdasd"));
});

Deno.test("test() handles wrong format", () => {
  const result = test(
    `---json
{"title": "Three dashes followed by format marks the spot"}
---
`,
    ["yaml"],
  );
  assertFalse(result);
});
