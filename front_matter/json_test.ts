// Copyright 2018-2026 the Deno authors. MIT license.

import { assert } from "@std/assert";
import { assertThrows } from "../assert/throws.ts";
import { extract } from "./json.ts";

import { assertEquals } from "@std/assert/equals";
import { test as unstableTest } from "./unstable_json.ts";

Deno.test("json() extracts type error on invalid input", () => {
  assertThrows(() => extract(""));
  assertThrows(() => extract("---"));
  assertThrows(() => extract(`---toml`));
  assertThrows(() => extract(`= toml =`));
  assertThrows(() => extract("---\n"));
  assertThrows(() => extract(`---toml\n`));
  assertThrows(() => extract(`= toml =\n`));
  assertThrows(() => extract("---\nasdasdasd"));
});

Deno.test("json() parses json delineate by ---json", () => {
  const input = `---json
{
  "title": "Three dashes followed by the format marks the spot",
  "tags": [
    "json",
    "front-matter"
  ],
  "expanded-description": "with some ---json 🙃 crazy stuff in it"
}
---
don't break
---
{Also: "---json this shouldn't be a problem"}
`;

  const actual = extract(input);
  const expected = {
    frontMatter: `{
  "title": "Three dashes followed by the format marks the spot",
  "tags": [
    "json",
    "front-matter"
  ],
  "expanded-description": "with some ---json 🙃 crazy stuff in it"
}`,
    body: "don't break\n---\n{Also: \"---json this shouldn't be a problem\"}\n",
    attrs: {
      title: "Three dashes followed by the format marks the spot",
      tags: ["json", "front-matter"],
      "expanded-description": "with some ---json 🙃 crazy stuff in it",
    },
  };
  assertEquals(actual, expected);
});

Deno.test("extractJson() allows whitespaces after the header", () => {
  assertEquals(extract('---json  \n{"foo": 0}\n---\n').attrs, { foo: 0 });
  assertEquals(extract('= json =  \n{"foo": 0}\n---\n').attrs, { foo: 0 });
});

Deno.test("extractJson() handles empty frontMatter", () => {
  assertEquals(
    extract("---json\n---\n"),
    { attrs: {}, body: "", frontMatter: "" },
  );

  assertEquals(
    extract("---json\n\n---\n"),
    { attrs: {}, body: "", frontMatter: "" },
  );
  assertEquals(
    extract("---json\n   \n---\n"),
    { attrs: {}, body: "", frontMatter: "" },
  );
});

Deno.test("extractJson() throws at missing newline before body", () => {
  assertThrows(
    () => extract('---json\n{ "foo": "bar" }\n---body'),
    TypeError,
    "Unexpected end of input",
  );
});

Deno.test("(unstable)test() handles valid json input", () => {
  assert(unstableTest("---json\nname = 'deno'\n---\n"));
  assert(unstableTest("= json =\nname = 'deno'\n= json =\n"));
  assert(unstableTest("= json =\nname = 'deno'\n= json =\ndeno is awesome\n"));
});

Deno.test("(unstable)test() handles invalid json input", () => {
  assert(!unstableTest(""));
  assert(!unstableTest("---"));
  assert(!unstableTest("---json"));
  assert(!unstableTest("= json ="));
  assert(!unstableTest("---\n"));
  assert(!unstableTest("---json\n"));
  assert(!unstableTest("= json =\n"));
  assert(!unstableTest("---\nasdasdasd"));
});
