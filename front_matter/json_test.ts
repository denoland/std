// Copyright 2018-2025 the Deno authors. MIT license.

import { assertThrows } from "../assert/throws.ts";
import { extract } from "./json.ts";

import { assertEquals } from "@std/assert/equals";

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

  const content = extract<Record<string, unknown>>(input);
  assertEquals(
    content.frontMatter,
    `{
  "title": "Three dashes followed by the format marks the spot",
  "tags": [
    "json",
    "front-matter"
  ],
  "expanded-description": "with some ---json 🙃 crazy stuff in it"
}`,
  );
  assertEquals(
    content.body,
    "don't break\n---\n{Also: \"---json this shouldn't be a problem\"}\n",
  );
  assertEquals(
    content.attrs.title,
    "Three dashes followed by the format marks the spot",
  );
  assertEquals(content.attrs.tags, ["json", "front-matter"]);
  assertEquals(
    content.attrs["expanded-description"],
    "with some ---json 🙃 crazy stuff in it",
  );
});

Deno.test("extractJson() allows whitespaces after the header", () => {
  assertEquals(extract('---json  \n{"foo": 0}\n---\n').attrs, { foo: 0 });
  assertEquals(extract('= json =  \n{"foo": 0}\n---\n').attrs, { foo: 0 });
});
