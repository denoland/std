// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals, assertThrows } from "../../testing/asserts.ts";
import extract, { Format, recognize, test } from "./json.ts";

Deno.test("[JSON] recognize", () => {
  Object.entries({
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
