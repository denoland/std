// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals, assertThrows } from "@std/assert";
import { dirname, fromFileUrl, join, resolve } from "@std/path";

const moduleDir = dirname(fromFileUrl(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");

type ExtractTestData = {
  title: string;
  tags: string[];
  "expanded-description": string;
};
type ExtractFn = (str: string) => {
  attrs: ExtractTestData;
  body: string;
  frontMatter: string;
};

export function resolveTestDataPath(filename: string): string {
  return join(testdataDir, filename);
}

export function runTestValidInputTests(
  format: "yaml" | "toml" | "json" | "unknown",
  testFn: (str: string) => boolean,
) {
  const testdata = [
    `---${format}\nname = 'deno'\n---\n`,
    `= ${format} =\nname = 'deno'\n= ${format} =\n`,
    `= ${format} =\nname = 'deno'\n= ${format} =\ndeno is awesome\n`,
  ];

  // yaml is the default format, so it should be recognized without the format name
  if (format === "yaml") {
    testdata.push(`---\nname: deno\n---\n`);
  }

  testdata.forEach((str) => {
    assert(testFn(str));
  });
}

export function runTestInvalidInputTests(
  format: "yaml" | "toml" | "json" | "unknown",
  testFn: (str: string) => boolean,
) {
  [
    "",
    "---",
    `---${format}`,
    `= ${format} =`,
    "---\n",
    `---${format}\n`,
    `= ${format} =\n`,
    `---\nasdasdasd`,
  ].forEach((str) => {
    assert(!testFn(str));
  });
}

export function runExtractTypeErrorTests(
  format: "yaml" | "toml" | "json" | "unknown",
  extractFn: (str: string) => unknown,
) {
  [
    "",
    "---",
    `---${format}`,
    `= ${format} =`,
    "---\n",
    `---${format}\n`,
    `= ${format} =\n`,
    "---\nasdasdasd",
  ].forEach((str) => {
    assertThrows(() => extractFn(str), TypeError);
  });
}

export async function runExtractJsonTests(
  extractFn: ExtractFn,
) {
  const str = await Deno.readTextFile(resolveTestDataPath("json.md"));
  const content = extractFn(str);

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
}

export async function runExtractYamlTests1(
  extractFn: ExtractFn,
) {
  const str = await Deno.readTextFile(resolveTestDataPath("yaml1.md"));
  const content = extractFn(str);

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
}

export async function runExtractYamlTests2(
  extractFn: ExtractFn,
) {
  const str = await Deno.readTextFile(resolveTestDataPath("yaml2.md"));
  const content = extractFn(str);

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
}

export async function runExtractTomlTests(
  extractFn: ExtractFn,
) {
  const str = await Deno.readTextFile(resolveTestDataPath("toml.md"));
  const content = extractFn(str);

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
}

export async function runExtractTomlTests2(
  extractFn: ExtractFn,
) {
  const str = await Deno.readTextFile(resolveTestDataPath("toml2.md"));
  const content = extractFn(str);

  assert(content !== undefined);
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
}
