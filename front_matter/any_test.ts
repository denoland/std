// Copyright 2018-2025 the Deno authors. MIT license.

import { extract } from "./any.ts";

import { assertEquals } from "../assert/equals.ts";
import { assertThrows } from "../assert/throws.ts";

Deno.test("extract() extracts type error on invalid input", () => {
  assertThrows(() => extract(""));
  assertThrows(() => extract("---"));
  assertThrows(() => extract(`---yaml`));
  assertThrows(() => extract(`= yaml =`));
  assertThrows(() => extract("---\n"));
  assertThrows(() => extract(`---yaml\n`));
  assertThrows(() => extract(`= yaml =\n`));
  assertThrows(() => extract("---\nasdasdasd"));
});

Deno.test("extract() parses yaml delineate by `---`", () => {
  const input = `---
title: Three dashes marks the spot
tags:
  - yaml
  - front-matter
  - dashes
expanded-description: with some --- crazy stuff in it
---
don't break
---
Also this shouldn't be a problem
`;
  const content = extract<Record<string, unknown>>(input);
  assertEquals(
    content.frontMatter,
    `title: Three dashes marks the spot
tags:
  - yaml
  - front-matter
  - dashes
expanded-description: with some --- crazy stuff in it`,
  );
  assertEquals(
    content.body,
    "don't break\n---\nAlso this shouldn't be a problem\n",
  );
  assertEquals(content.attrs.title, "Three dashes marks the spot");
  assertEquals(content.attrs.tags, ["yaml", "front-matter", "dashes"]);
  assertEquals(
    content.attrs["expanded-description"],
    "with some --- crazy stuff in it",
  );
});

Deno.test("extract() parses yaml delineate by `---yaml`", () => {
  const input = `---yaml
title: Three dashes marks the spot
tags:
  - yaml
  - front-matter
  - dashes
expanded-description: with some --- crazy stuff in it
---
don't break
---
Also this shouldn't be a problem
`;
  const content = extract<Record<string, unknown>>(input);
  assertEquals(
    content.frontMatter,
    `title: Three dashes marks the spot
tags:
  - yaml
  - front-matter
  - dashes
expanded-description: with some --- crazy stuff in it`,
  );
  assertEquals(
    content.body,
    "don't break\n---\nAlso this shouldn't be a problem\n",
  );
  assertEquals(content.attrs.title, "Three dashes marks the spot");
  assertEquals(content.attrs.tags, ["yaml", "front-matter", "dashes"]);
  assertEquals(
    content.attrs["expanded-description"],
    "with some --- crazy stuff in it",
  );
});

Deno.test("extract() extracts type error on invalid json input", () => {
  assertThrows(() => extract(""));
  assertThrows(() => extract("---"));
  assertThrows(() => extract(`---json`));
  assertThrows(() => extract(`= json =`));
  assertThrows(() => extract("---\n"));
  assertThrows(() => extract(`---json\n`));
  assertThrows(() => extract(`= json =\n`));
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

Deno.test("extract() extracts type error on invalid toml input", () => {
  assertThrows(() => extract(""));
  assertThrows(() => extract("---"));
  assertThrows(() => extract(`---toml`));
  assertThrows(() => extract(`= toml =`));
  assertThrows(() => extract("---\n"));
  assertThrows(() => extract(`---toml\n`));
  assertThrows(() => extract(`= toml =\n`));
  assertThrows(() => extract("---\nasdasdasd"));
});

Deno.test("extract() parses toml delineate by ---toml", () => {
  const input = `---toml
title = 'Three dashes followed by the format marks the spot'
tags = ['toml', 'front-matter']
'expanded-description' = 'with some ---toml 👌 crazy stuff in it'
---
don't break
---
Also = '---toml this shouldn't be a problem'
`;
  const content = extract<Record<string, unknown>>(input);
  assertEquals(
    content.frontMatter,
    `title = 'Three dashes followed by the format marks the spot'
tags = ['toml', 'front-matter']
'expanded-description' = 'with some ---toml 👌 crazy stuff in it'`,
  );
  assertEquals(
    content.body,
    "don't break\n---\nAlso = '---toml this shouldn't be a problem'\n",
  );
  assertEquals(
    content.attrs.title,
    "Three dashes followed by the format marks the spot",
  );
  assertEquals(content.attrs.tags, ["toml", "front-matter"]);
  assertEquals(
    content.attrs["expanded-description"],
    "with some ---toml 👌 crazy stuff in it",
  );
});
