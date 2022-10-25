// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals, assertThrows } from "../../testing/asserts.ts";
import { Format } from "./mod.ts";

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

export function runRecognizeTests(
  recognizeFn: (str: string) => Format,
  expectedToBeRecognized: Format[],
) {
  const testdata = new Map<Format, string[]>();
  testdata.set(Format.UNKNOWN, [
    "---xml\n<title>Three dashes marks the spot</title>\n---\n",
    "= xml =\n<title>Format name between equal signs also marks the spot</title>\n= xml =\n",
  ]);

  expectedToBeRecognized.forEach((format) => {
    switch (format) {
      case Format.YAML:
        testdata.set(format, [
          "---\ntitle: Three dashes marks the spot\n---\n",
          "---yaml\ntitle: Three dashes followed by format name marks the spot\n---\n",
          "= yaml =\ntitle: Format name between equal signs also marks the spot\n= yaml =\n",
        ]);
        break;

      case Format.TOML:
        testdata.set(format, [
          "---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n",
          "= toml =\ntitle = 'Format name between equal signs also marks the spot'\n= toml =\n",
        ]);
        break;

      case Format.JSON:
        testdata.set(format, [
          '---json\n{"title": "Three dashes followed by format marks the spot"}\n---\n',
          '= json =\n{"title": "Format name between equal signs also marks the spot"}\n= json =\n',
        ]);
        break;
    }
  });

  for (const [format, strs] of testdata) {
    strs.forEach((str) => {
      assertEquals(recognizeFn(str), format);
    });
  }
}

export function runTestValidInputTests(
  format: Format,
  testFn: (str: string) => boolean,
) {
  const testdata = [
    `---${format}\nname = 'deno'\n---\n`,
    `= ${format} =\nname = 'deno'\n= ${format} =\n`,
    `= ${format} =\nname = 'deno'\n= ${format} =\ndeno is awesome\n`,
  ];

  // yaml is the default format, so it should be recognized without the format name
  if (format === Format.YAML) {
    testdata.push(`---\nname: deno\n---\n`);
  }

  testdata.forEach((str) => {
    assert(testFn(str));
  });
}

export function runTestInvalidInputTests(
  format: Format,
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
  format: Format,
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

export function runExtractJSONTests(
  extractFn: ExtractFn,
) {
  const content = extractFn(`---json
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
}

export function runExtractYAMLTests1(
  extractFn: ExtractFn,
) {
  const content = extractFn(`---
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
}

export function runExtractYAMLTests2(
  extractFn: ExtractFn,
) {
  const content = extractFn(`---yaml
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
}

export function runExtractTOMLTests(
  extractFn: ExtractFn,
) {
  const content = extractFn(`---toml
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
}
