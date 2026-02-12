// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { parseRange } from "./parse_range.ts";
import type { Range } from "./types.ts";

Deno.test("parseRange() parse ranges of different kinds", () => {
  const ranges: [string, Range][] = [
    ["1.0.0 - 2.0.0", [
      [
        {
          operator: ">=",
          major: 1,
          minor: 0,
          patch: 0,
          prerelease: [],
          build: [],
        },
        {
          operator: "<=",
          major: 2,
          minor: 0,
          patch: 0,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["1.2.3+asdf - 2.4.3+asdf", [
      [
        {
          operator: ">=",
          major: 1,
          minor: 2,
          patch: 3,
          prerelease: [],
          build: [],
        },
        {
          operator: "<=",
          major: 2,
          minor: 4,
          patch: 3,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["^1.2.3+build", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 3, prerelease: [] },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
    ["1.2.3-pre+asdf - 2.4.3-pre+asdf", [
      [
        {
          operator: ">=",
          major: 1,
          minor: 2,
          patch: 3,
          prerelease: ["pre"],
          build: [],
        },
        {
          operator: "<=",
          major: 2,
          minor: 4,
          patch: 3,
          prerelease: ["pre"],
          build: [],
        },
      ],
    ]],
    ["^1.2", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 0 },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
    [">1.2", [[{ operator: ">=", major: 1, minor: 3, patch: 0 }]]],
    ["<=1.2.3", [
      [
        {
          operator: "<=",
          major: 1,
          minor: 2,
          patch: 3,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["<1.2.3", [
      [
        {
          operator: "<",
          major: 1,
          minor: 2,
          patch: 3,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["=1.2.3", [
      [
        {
          operator: "=",
          major: 1,
          minor: 2,
          patch: 3,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["=0.7.x", [
      [
        { operator: ">=", major: 0, minor: 7, patch: 0 },
        { operator: "<", major: 0, minor: 8, patch: 0 },
      ],
    ]],
    [">=0.7.x", [[{ operator: ">=", major: 0, minor: 7, patch: 0 }]]],
    ["1.0.0", [
      [
        {
          operator: undefined,
          major: 1,
          minor: 0,
          patch: 0,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    [">=1.0.0", [
      [
        {
          operator: ">=",
          major: 1,
          minor: 0,
          patch: 0,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    [">1.0.0", [
      [
        {
          operator: ">",
          major: 1,
          minor: 0,
          patch: 0,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["<=2.0.0", [
      [
        {
          operator: "<=",
          major: 2,
          minor: 0,
          patch: 0,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["<2.0.0", [
      [
        {
          operator: "<",
          major: 2,
          minor: 0,
          patch: 0,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    [">=0.1.97", [
      [
        {
          operator: ">=",
          major: 0,
          minor: 1,
          patch: 97,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["0.1.20 || 1.2.4", [
      [
        {
          operator: undefined,
          major: 0,
          minor: 1,
          patch: 20,
          prerelease: [],
          build: [],
        },
      ],
      [
        {
          operator: undefined,
          major: 1,
          minor: 2,
          patch: 4,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    [">=0.2.3 || <0.0.1", [
      [
        {
          operator: ">=",
          major: 0,
          minor: 2,
          patch: 3,
          prerelease: [],
          build: [],
        },
      ],
      [
        {
          operator: "<",
          major: 0,
          minor: 0,
          patch: 1,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["2.x.x", [
      [
        { operator: ">=", major: 2, minor: 0, patch: 0 },
        { operator: "<", major: 3, minor: 0, patch: 0 },
      ],
    ]],
    ["1.2.x", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 0 },
        { operator: "<", major: 1, minor: 3, patch: 0 },
      ],
    ]],
    ["1.2.x || 2.x", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 0 },
        { operator: "<", major: 1, minor: 3, patch: 0 },
      ],
      [
        { operator: ">=", major: 2, minor: 0, patch: 0 },
        { operator: "<", major: 3, minor: 0, patch: 0 },
      ],
    ]],
    ["2.*.*", [
      [
        { operator: ">=", major: 2, minor: 0, patch: 0 },
        { operator: "<", major: 3, minor: 0, patch: 0 },
      ],
    ]],
    ["1.2.*", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 0 },
        { operator: "<", major: 1, minor: 3, patch: 0 },
      ],
    ]],
    ["1.2.* || 2.*", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 0 },
        { operator: "<", major: 1, minor: 3, patch: 0 },
      ],
      [
        { operator: ">=", major: 2, minor: 0, patch: 0 },
        { operator: "<", major: 3, minor: 0, patch: 0 },
      ],
    ]],
    ["2", [
      [
        { operator: ">=", major: 2, minor: 0, patch: 0 },
        { operator: "<", major: 3, minor: 0, patch: 0 },
      ],
    ]],
    ["2.3", [
      [
        { operator: ">=", major: 2, minor: 3, patch: 0 },
        { operator: "<", major: 2, minor: 4, patch: 0 },
      ],
    ]],
    ["~0.0.1", [
      [
        { operator: ">=", major: 0, minor: 0, patch: 1, prerelease: [] },
        { operator: "<", major: 0, minor: 1, patch: 0 },
      ],
    ]],
    ["~2.4", [
      [
        { operator: ">=", major: 2, minor: 4, patch: 0 },
        { operator: "<", major: 2, minor: 5, patch: 0 },
      ],
    ]],
    ["~>3.2.1", [
      [
        { operator: ">=", major: 3, minor: 2, patch: 1, prerelease: [] },
        { operator: "<", major: 3, minor: 3, patch: 0 },
      ],
    ]],
    ["~1", [
      [
        { operator: ">=", major: 1, minor: 0, patch: 0 },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
    ["~>1", [
      [
        { operator: ">=", major: 1, minor: 0, patch: 0 },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
    ["~1.0", [
      [
        { operator: ">=", major: 1, minor: 0, patch: 0 },
        { operator: "<", major: 1, minor: 1, patch: 0 },
      ],
    ]],
    ["<1", [[{ operator: "<", major: 1, minor: 0, patch: 0 }]]],
    [">=1.2", [[{ operator: ">=", major: 1, minor: 2, patch: 0 }]]],
    ["~v0.5.4-beta", [
      [
        {
          operator: ">=",
          major: 0,
          minor: 5,
          patch: 4,
          prerelease: ["beta"],
        },
        { operator: "<", major: 0, minor: 6, patch: 0 },
      ],
    ]],
    ["<0.7.x", [[{ operator: "<", major: 0, minor: 7, patch: 0 }]]],
    ["^0.0.1", [
      [
        { operator: ">=", major: 0, minor: 0, patch: 1, prerelease: [] },
        { operator: "<", major: 0, minor: 0, patch: 2 },
      ],
    ]],
    ["^1.2.3", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 3, prerelease: [] },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
  ];

  for (const [r, expected] of ranges) {
    const range = parseRange(r);
    assertEquals(range, expected);
  }
});

Deno.test("parseRange() parse ranges with hyphens", () => {
  const ranges: [string, Range][] = [
    ["1.2.3 - 2.3.4", [
      [
        {
          operator: ">=",
          major: 1,
          minor: 2,
          patch: 3,
          prerelease: [],
          build: [],
        },
        {
          operator: "<=",
          major: 2,
          minor: 3,
          patch: 4,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["1.2 - 2.3.4", [
      [
        {
          operator: ">=",
          major: 1,
          minor: 2,
          patch: 0,
          prerelease: [],
          build: [],
        },
        {
          operator: "<=",
          major: 2,
          minor: 3,
          patch: 4,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["1.2.3 - 2.3", [
      [
        {
          operator: ">=",
          major: 1,
          minor: 2,
          patch: 3,
          prerelease: [],
          build: [],
        },
        {
          operator: "<",
          major: 2,
          minor: 4,
          patch: 0,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["1.2.3 - 2", [
      [
        {
          operator: ">=",
          major: 1,
          minor: 2,
          patch: 3,
          prerelease: [],
          build: [],
        },
        {
          operator: "<",
          major: 3,
          minor: 0,
          patch: 0,
          prerelease: [],
          build: [],
        },
      ],
    ]],
  ];

  for (const [r, expected] of ranges) {
    const range = parseRange(r);
    assertEquals(range, expected);
  }
});

Deno.test("parseRange() parses ranges with x", () => {
  const ranges: [string, Range][] = [
    ["*", [
      [
        {
          operator: undefined,
          major: NaN,
          minor: NaN,
          patch: NaN,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["1.x", [
      [
        { operator: ">=", major: 1, minor: 0, patch: 0 },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
    ["1.2.x", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 0 },
        { operator: "<", major: 1, minor: 3, patch: 0 },
      ],
    ]],
    ["", [
      [
        {
          operator: undefined,
          major: NaN,
          minor: NaN,
          patch: NaN,
          prerelease: [],
          build: [],
        },
      ],
    ]],
    ["1", [
      [
        { operator: ">=", major: 1, minor: 0, patch: 0 },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
    ["1.2", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 0 },
        { operator: "<", major: 1, minor: 3, patch: 0 },
      ],
    ]],
  ];

  for (const [r, expected] of ranges) {
    const range = parseRange(r);
    assertEquals(range, expected);
  }
});

Deno.test("parseRanges() parses ranges with tilde", () => {
  const ranges: [string, Range][] = [
    ["~1.2.3", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 3, prerelease: [] },
        { operator: "<", major: 1, minor: 3, patch: 0 },
      ],
    ]],
    ["~1.2", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 0 },
        { operator: "<", major: 1, minor: 3, patch: 0 },
      ],
    ]],
    ["~1", [
      [
        { operator: ">=", major: 1, minor: 0, patch: 0 },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
    ["~0.2.3", [
      [
        { operator: ">=", major: 0, minor: 2, patch: 3, prerelease: [] },
        { operator: "<", major: 0, minor: 3, patch: 0 },
      ],
    ]],
    ["~0.2", [
      [
        { operator: ">=", major: 0, minor: 2, patch: 0 },
        { operator: "<", major: 0, minor: 3, patch: 0 },
      ],
    ]],
    ["~0", [
      [
        { operator: ">=", major: 0, minor: 0, patch: 0 },
        { operator: "<", major: 1, minor: 0, patch: 0 },
      ],
    ]],
    ["~1.2.3-beta.2", [
      [
        {
          operator: ">=",
          major: 1,
          minor: 2,
          patch: 3,
          prerelease: ["beta", 2],
        },
        { operator: "<", major: 1, minor: 3, patch: 0 },
      ],
    ]],
  ];

  for (const [r, expected] of ranges) {
    const range = parseRange(r);
    assertEquals(range, expected);
  }
});

Deno.test("parseRange() parses ranges with caret", () => {
  const ranges: [string, Range][] = [
    ["^1.2.3", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 3, prerelease: [] },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
    ["^ 1.2.3", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 3, prerelease: [] },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
    ["^0.2.3", [
      [
        { operator: ">=", major: 0, minor: 2, patch: 3, prerelease: [] },
        { operator: "<", major: 0, minor: 3, patch: 0 },
      ],
    ]],
    ["^0.0.3", [
      [
        { operator: ">=", major: 0, minor: 0, patch: 3, prerelease: [] },
        { operator: "<", major: 0, minor: 0, patch: 4 },
      ],
    ]],
    ["^1.2.3-beta.2", [
      [
        {
          operator: ">=",
          major: 1,
          minor: 2,
          patch: 3,
          prerelease: ["beta", 2],
        },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
    ["^0.0.3-beta", [
      [
        {
          operator: ">=",
          major: 0,
          minor: 0,
          patch: 3,
          prerelease: ["beta"],
        },
        { operator: "<", major: 0, minor: 0, patch: 4 },
      ],
    ]],
    ["^1.2.x", [
      [
        { operator: ">=", major: 1, minor: 2, patch: 0 },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
    ["^0.0.x", [
      [
        { operator: ">=", major: 0, minor: 0, patch: 0 },
        { operator: "<", major: 0, minor: 1, patch: 0 },
      ],
    ]],
    ["^0.0", [
      [
        { operator: ">=", major: 0, minor: 0, patch: 0 },
        { operator: "<", major: 0, minor: 1, patch: 0 },
      ],
    ]],
    ["^1.x", [
      [
        { operator: ">=", major: 1, minor: 0, patch: 0 },
        { operator: "<", major: 2, minor: 0, patch: 0 },
      ],
    ]],
    ["^0.x", [
      [
        { operator: ">=", major: 0, minor: 0, patch: 0 },
        { operator: "<", major: 1, minor: 0, patch: 0 },
      ],
    ]],
  ];

  for (const [r, expected] of ranges) {
    const range = parseRange(r);
    assertEquals(range, expected);
  }
});

Deno.test("parseRange() throws on invalid range", () => {
  assertThrows(
    () => parseRange("blerg"),
    TypeError,
    'Cannot parse version range: range "blerg" is invalid',
  );

  assertThrows(
    () => parseRange("1.b.c"),
    TypeError,
    'Cannot parse version range: range "1.b.c" is invalid',
  );
});

Deno.test("parseRange() handles wildcards", () => {
  assertEquals(parseRange("<1.*"), [
    [{ operator: "<", major: 1, minor: 0, patch: 0 }],
  ]);
  assertEquals(parseRange("<1.*.0"), [
    [{ operator: "<", major: 1, minor: 0, patch: 0 }],
  ]);
  assertEquals(parseRange("<1.*.*"), [
    [{ operator: "<", major: 1, minor: 0, patch: 0 }],
  ]);
  assertEquals(parseRange("<=1.*.2"), [
    [{ operator: "<", major: 2, minor: 0, patch: 0 }],
  ]);
  assertEquals(parseRange(">=1.*.0"), [
    [{ operator: ">=", major: 1, minor: 0, patch: 0 }],
  ]);
  assertEquals(parseRange(">=1.*.*"), [
    [{ operator: ">=", major: 1, minor: 0, patch: 0 }],
  ]);
  assertEquals(parseRange(">=1.0.*"), [
    [{ operator: ">=", major: 1, minor: 0, patch: 0 }],
  ]);
});
