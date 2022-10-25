// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals, assertThrows } from "../../testing/asserts.ts";
import extract, { Format, recognize, test } from "./toml.ts";

Deno.test("[TOML] recognize", () => {
  Object.entries({
    [Format.TOML]: [
      "---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n",
      "= toml =\ntitle = 'Format name between equal signs also marks the spot'\n= toml =\n",
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

Deno.test("[TOML] parse toml delineate by ---toml", () => {
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
