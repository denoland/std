// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals, assertThrows } from "../../testing/asserts.ts";
import extract, { Format, recognize, test } from "./yaml.ts";

Deno.test("[YAML] recognize", () => {
  Object.entries({
    [Format.YAML]: [
      "---\ntitle: Three dashes marks the spot\n---\n",
      "---yaml\ntitle: Three dashes followed by format name marks the spot\n---\n",
      "= yaml =\ntitle: Format name between equal signs also marks the spot\n= yaml =\n",
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
