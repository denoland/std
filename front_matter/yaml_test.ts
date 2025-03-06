// Copyright 2018-2025 the Deno authors. MIT license.

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

Deno.test("yaml() parses yaml delineate by `---`", () => {
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
  const content = extract(input);

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

Deno.test("yaml() parses yaml delineate by `---yaml`", () => {
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
  const content = extract(input);

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
