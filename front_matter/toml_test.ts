// Copyright 2018-2026 the Deno authors. MIT license.

import { assertThrows } from "../assert/throws.ts";
import { extract } from "./toml.ts";
import { assertEquals } from "@std/assert/equals";

Deno.test("toml() extracts type error on invalid input", () => {
  assertThrows(() => extract(""));
  assertThrows(() => extract("---"));
  assertThrows(() => extract(`---toml`));
  assertThrows(() => extract(`= toml =`));
  assertThrows(() => extract("---\n"));
  assertThrows(() => extract(`---toml\n`));
  assertThrows(() => extract(`= toml =\n`));
  assertThrows(() => extract("---\nasdasdasd"));
});

Deno.test("toml() parses toml delineate by ---toml", () => {
  const input = `---toml
title = 'Three dashes followed by the format marks the spot'
tags = ['toml', 'front-matter']
'expanded-description' = 'with some ---toml 👌 crazy stuff in it'
---
don't break
---
Also = '---toml this shouldn't be a problem'
`;
  const actual = extract<Record<string, unknown>>(input);
  const expected = {
    frontMatter: `title = 'Three dashes followed by the format marks the spot'
tags = ['toml', 'front-matter']
'expanded-description' = 'with some ---toml 👌 crazy stuff in it'`,
    body: "don't break\n---\nAlso = '---toml this shouldn't be a problem'\n",
    attrs: {
      title: "Three dashes followed by the format marks the spot",
      tags: ["toml", "front-matter"],
      "expanded-description": "with some ---toml 👌 crazy stuff in it",
    },
  };
  assertEquals(actual, expected);
});

Deno.test("toml() parses toml delineate by +++", () => {
  const input = `+++
title = 'Three pluses followed by the format marks the spot'
tags = ['toml', 'front-matter']
'expanded-description' = 'with some +++toml 👌 crazy stuff in it'
+++
don't break
+++
Also = '+++toml this shouldn't be a problem'
`;
  const content = extract<Record<string, unknown>>(input);

  assertEquals(
    content.frontMatter,
    `title = 'Three pluses followed by the format marks the spot'
tags = ['toml', 'front-matter']
'expanded-description' = 'with some +++toml 👌 crazy stuff in it'`,
  );
  assertEquals(
    content.body,
    "don't break\n+++\nAlso = '+++toml this shouldn't be a problem'\n",
  );
  assertEquals(
    content.attrs.title,
    "Three pluses followed by the format marks the spot",
  );
  assertEquals(content.attrs.tags, ["toml", "front-matter"]);
  assertEquals(
    content.attrs["expanded-description"],
    "with some +++toml 👌 crazy stuff in it",
  );
});

Deno.test("extractToml() allows whitespaces after the header", () => {
  assertEquals(extract("---toml  \nfoo = 0\n---\n").attrs, { foo: 0 });
  assertEquals(extract("+++  \nfoo = 0\n--- \n").attrs, { foo: 0 });
  assertEquals(extract("= toml =  \nfoo = 0\n---\n").attrs, { foo: 0 });
});

Deno.test("extractToml() handles empty frontMatter", () => {
  assertEquals(
    extract("---toml\n---"),
    { attrs: {}, body: "", frontMatter: "" },
  );
  assertEquals(
    extract("---toml\n\n---\n"),
    { attrs: {}, body: "", frontMatter: "" },
  );
  assertEquals(
    extract("---toml\n   \n---\n"),
    { attrs: {}, body: "", frontMatter: "" },
  );
});

Deno.test("extractToml() throws at missing newline before body", () => {
  assertThrows(
    () => extract('---toml\nfoo = "bar"\n---body'),
    TypeError,
    "Unexpected end of input",
  );
});
