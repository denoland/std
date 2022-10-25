// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { createExtractor, Format, Parser, recognize, test } from "./mod.ts";
import { assert, assertEquals, assertThrows } from "../../testing/asserts.ts";
import { parse as parseYAML } from "../yaml.ts";
import { parse as parseTOML } from "../toml.ts";
const extractYAML = createExtractor({ [Format.YAML]: parseYAML as Parser });
const extractTOML = createExtractor({ [Format.TOML]: parseTOML as Parser });
const extractJSON = createExtractor({ [Format.JSON]: JSON.parse as Parser });
const extractYAMLOrJSON = createExtractor({
  [Format.YAML]: parseYAML as Parser,
  [Format.JSON]: JSON.parse as Parser,
});

// GENERAL TESTS //

Deno.test("[ANY] recognize", () => {
  Object.entries({
    [Format.YAML]: [
      "---\ntitle: Three dashes marks the spot\n---\n",
      "---yaml\ntitle: Three dashes followed by format name marks the spot\n---\n",
      "= yaml =\ntitle: Format name between equal signs also marks the spot\n= yaml =\n",
    ],
    [Format.TOML]: [
      "---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n",
      "= toml =\ntitle = 'Format name between equal signs also marks the spot'\n= toml =\n",
    ],
    [Format.JSON]: [
      '---json\n{"title": "Three dashes followed by format marks the spot"}\n---\n',
      '= json =\n{"title": "Format name between equal signs also marks the spot"}\n= json =\n',
    ],
    [Format.UNKNOWN]: [
      "---xml\n<title>Three dashes marks the spot</title>\n---\n",
      "= xml =\n<title>Format name between equal signs also marks the spot</title>\n= xml =\n",
    ],
  }).forEach(([format, strs]) => {
    strs.forEach((str) => {
      assertEquals(recognize(str), format);
    });
  });
});

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
    assertThrows(() => extractYAML(str), TypeError);
  });
});

Deno.test("[YAML] parse yaml delineate by `---`", () => {
  const content = extractYAML<
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
  const content = extractYAML<
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
    assertThrows(() => extractJSON(str), TypeError);
  });
});

Deno.test("[JSON] parse json delineate by ---json", () => {
  const content = extractJSON<
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
    assertThrows(() => extractTOML(str), TypeError);
  });
});

Deno.test("[TOML] parse toml delineate by ---toml", () => {
  const content = extractTOML<
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

// MULTIPLE FORMATS //

Deno.test("[YAML or JSON] parse input", () => {
  let content = extractYAMLOrJSON<
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

  content = extractYAMLOrJSON<
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
