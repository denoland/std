// Copyright 2018-2026 the Deno authors. MIT license.

import { extract } from "./yaml.ts";
import { extract as unstableExtract } from "./unstable_yaml.ts";
import { assertEquals } from "@std/assert/equals";
import { assertThrows } from "../assert/throws.ts";

Deno.test("yaml() extracts type error on invalid input", () => {
  assertThrows(() => extract(""));
  assertThrows(() => extract("---"));
  assertThrows(() => extract(`---yaml`));
  assertThrows(() => extract(`= yaml =`));
  assertThrows(() => extract("---\n"));
  assertThrows(() => extract(`---yaml\n`));
  assertThrows(() => extract(`= yaml =\n`));
  assertThrows(() => extract("---\nasdasdasd"));
});

Deno.test("yaml() parses yaml delineated by `---`", () => {
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

  const expected = {
    frontMatter: `title: Three dashes marks the spot
tags:
  - yaml
  - front-matter
  - dashes
expanded-description: with some --- crazy stuff in it`,
    body: "don't break\n---\nAlso this shouldn't be a problem\n",
    attrs: {
      title: "Three dashes marks the spot",
      tags: ["yaml", "front-matter", "dashes"],
      "expanded-description": "with some --- crazy stuff in it",
    },
  };

  const content = extract<Record<string, unknown>>(input);
  assertEquals(content, expected);
});

Deno.test("yaml() parses yaml delineated by `---yaml`", () => {
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

  const expected = {
    frontMatter: `title: Three dashes marks the spot
tags:
  - yaml
  - front-matter
  - dashes
expanded-description: with some --- crazy stuff in it`,
    body: "don't break\n---\nAlso this shouldn't be a problem\n",
    attrs: {
      title: "Three dashes marks the spot",
      tags: ["yaml", "front-matter", "dashes"],
      "expanded-description": "with some --- crazy stuff in it",
    },
  };

  const content = extract<Record<string, unknown>>(input);
  assertEquals(content, expected);
});

Deno.test("extractYaml() allows whitespaces after the header", () => {
  assertEquals(extract("---  \nfoo: 0\n---\n").attrs, { foo: 0 });
  assertEquals(extract("---yaml  \nfoo: 0\n--- \n").attrs, { foo: 0 });
  assertEquals(extract("= yaml =  \nfoo: 0\n---\n").attrs, { foo: 0 });
});

Deno.test("(unstable)extractYaml() parses with schema options", () => {
  assertEquals(
    unstableExtract("---\ndate: 2024-08-20\n---\n", { schema: "json" }).attrs,
    {
      date: "2024-08-20",
    },
  );
});

Deno.test("extractYaml() handles empty frontMatter", () => {
  assertEquals(
    extract("---\n---\n"),
    { attrs: {}, body: "", frontMatter: "" },
  );

  assertEquals(
    extract("---\n\n---\n"),
    { attrs: {}, body: "", frontMatter: "" },
  );
  assertEquals(
    extract("---\n   \n---\n"),
    { attrs: {}, body: "", frontMatter: "" },
  );

  assertThrows(
    () => extract("---yaml\nfoo: bar\n---body"),
    TypeError,
    "Unexpected end of input",
  );
});

Deno.test("extractYaml() throws at missing newline before body", () => {
  assertThrows(
    () => extract("---yaml\nfoo: bar\n---body"),
    TypeError,
    "Unexpected end of input",
  );
});
