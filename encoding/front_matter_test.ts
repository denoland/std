// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { extract, test } from "./front_matter.ts";
import { assert, assertEquals, assertThrows } from "../testing/asserts.ts";

// YAML //

Deno.test("[YAML] test valid input true", () => {
  [
    "---\nname: deno\n---\n",
    "---yaml\nname: deno\n---\n",
    "= yaml =\nname: deno\n= yaml =\n",
    "= yaml =\nname: deno\n= yaml =\ndeno is awesome\n",
  ].forEach((str) => {
    assert(test(str));
  });
});

Deno.test("[YAML] test invalid input false", () => {
  [
    "",
    "---",
    "---yaml",
    "= yaml =",
    "---\n",
    "---yaml\n",
    "= yaml =\n",
    "---\nasdasdasd",
  ].forEach((str) => {
    assert(!test(str));
  });
});

Deno.test("[YAML] extract type error on invalid input", () => {
  [
    "",
    "---",
    "---yaml",
    "= yaml =",
    "---\n",
    "---yaml\n",
    "= yaml =\n",
    "---\nasdasdasd",
  ].forEach((str) => {
    assertThrows(() => extract(str), TypeError);
  });
});

Deno.test("[YAML] parse yaml delineate by `---`", () => {
  const content = extract<
    { title: string; tags: string[]; "expanded-description": string }
  >(`---
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
`);
  assert(content !== undefined);
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

Deno.test("[YAML] parse yaml delineate by `---yaml`", () => {
  const content = extract<
    { title: string; tags: string[]; "expanded-description": string }
  >(`---yaml
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
`);
  assert(content !== undefined);
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

// JSON //

Deno.test("[JSON] test valid input true", () => {
  [
    '---json\n{\n  "name": "deno"\n}\n---\n',
    '= json =\n{\n  "name": "deno"\n}\n= json =\n',
    '= json =\n{\n  "name": "deno"\n}\n= json =\ndeno is awesome\n',
  ].forEach((str) => {
    assert(test(str));
  });
});

Deno.test("[JSON] test invalid input false", () => {
  [
    "",
    "---json",
    "= json =",
    "---json\n",
    "= json =\n",
    "---json\nasdasdasd",
  ].forEach((str) => {
    assert(!test(str));
  });
});

Deno.test("[JSON] extract type error on invalid input", () => {
  [
    "",
    "---json",
    "= json =",
    "---json\n",
    "= json =\n",
    "---json\nasdasdasd",
  ].forEach((str) => {
    assertThrows(() => extract(str), TypeError);
  });
});

Deno.test("[JSON] parse json delineate by ---json", () => {
  const content = extract<
    { title: string; tags: string[]; "expanded-description": string }
  >(`---json
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
`);
  assert(content !== undefined);
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

// TOML //

Deno.test("[TOML] test valid input true", () => {
  [
    "---toml\nname = 'deno'\n---\n",
    "= toml =\nname = 'deno'\n= toml =\n",
    "= toml =\nname = 'deno'\n= toml =\ndeno is awesome\n",
  ].forEach((str) => {
    assert(test(str));
  });
});

Deno.test("[TOML] test invalid input false", () => {
  [
    "",
    "---toml",
    "= toml =",
    "---toml\n",
    "= toml =\n",
    "---toml\nasdasdasd",
  ].forEach((str) => {
    assert(!test(str));
  });
});

Deno.test("[TOML] extract type error on invalid input", () => {
  [
    "",
    "---toml",
    "= toml =",
    "---toml\n",
    "= toml =\n",
    "---toml\nasdasdasd",
  ].forEach((str) => {
    assertThrows(() => extract(str), TypeError);
  });
});

Deno.test("[TOML] parse json delineate by ---toml", () => {
  const content = extract<
    { title: string; tags: string[]; "expanded-description": string }
  >(`---toml
title = 'Three dashes followed by the format marks the spot'
tags = ['toml', 'front-matter']
'expanded-description' = 'with some ---toml 👌 crazy stuff in it'
---
don't break
---
Also = '---toml this shouldn't be a problem'
`);
  assert(content !== undefined);
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
