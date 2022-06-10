import { extract, test } from "./front_matter.ts";
import { assert, assertEquals, assertThrows } from "../testing/asserts.ts";

Deno.test("test valid input true", () => {
  [
    "---\nname: deno\n---\n",
    "= yaml =\nname: deno\n= yaml =\n",
    "= yaml =\nname: deno\n= yaml =\ndeno is awesome\n",
  ].forEach((str) => {
    assert(test(str));
  });
});

Deno.test("test invalid input false", () => {
  [
    "",
    "---",
    "= yaml =",
    "---\n",
    "= yaml =\n",
    "---\nasdasdasd",
  ].forEach((str) => {
    assert(!test(str));
  });
});

Deno.test("extract type error on invalid input", () => {
  [
    "",
    "---",
    "= yaml =",
    "---\n",
    "= yaml =\n",
    "---\nasdasdasd",
  ].forEach((str) => {
    assertThrows(() => extract(str), TypeError);
  });
});

Deno.test("parse yaml delinetead by `---`", () => {
  const content = extract<
    { title: string; tags: string[]; "expaned-description": string }
  >(`---
title: Three dashes marks the spot
tags:
  - yaml
  - front-matter
  - dashes
expaned-description: with some --- crazy stuff in it
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
expaned-description: with some --- crazy stuff in it`,
  );
  assertEquals(
    content.body,
    "don't break\n---\nAlso this shouldn't be a problem\n",
  );
  assertEquals(content.attrs.title, "Three dashes marks the spot");
  assertEquals(content.attrs.tags, ["yaml", "front-matter", "dashes"]);
  assertEquals(
    content.attrs["expaned-description"],
    "with some --- crazy stuff in it",
  );
});
