// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import {
  contentType,
  extension,
  extensionsByType,
  formatMediaType,
  getCharset,
  parseMediaType,
  typeByExtension,
} from "./mod.ts";

Deno.test({
  name: "media_types - contentType()",
  fn() {
    const fixtures = [
      [".json", "application/json; charset=UTF-8"],
      ["text/html", "text/html; charset=UTF-8"],
      ["txt", "text/plain; charset=UTF-8"],
      ["text/plain; charset=ISO-8859-1", "text/plain; charset=ISO-8859-1"],
      ["foo", undefined],
      ["file.json", undefined],
      ["application/foo", "application/foo"],
    ] as const;
    for (const [fixture, expected] of fixtures) {
      assertEquals(contentType(fixture), expected);
    }
  },
});

Deno.test({
  name: "media_types - contentType()",
  fn() {
    let _str: string;
    // For well-known content types, the return type is a string.
    // string is assignable to string
    _str = contentType(".json");
    _str = contentType("text/html");
    _str = contentType("txt");

    // @ts-expect-error: string | undefined is not assignable to string
    _str = contentType("text/plain; charset=ISO-8859-1");
    // @ts-expect-error: string | undefined is not assignable to string
    _str = contentType("foo");
    // @ts-expect-error: string | undefined is not assignable to string
    _str = contentType("file.json");
    // @ts-expect-error: string | undefined is not assignable to string
    _str = contentType("application/foo");
  },
});

Deno.test({
  name: "media_types - extension()",
  fn() {
    const fixtures: [string, string | undefined][] = [
      ["image/gif", "gif"],
      ["application/javascript", "js"],
      ["text/html; charset=UTF-8", "html"],
      ["application/foo", undefined],
    ];
    for (const [fixture, expected] of fixtures) {
      assertEquals(extension(fixture), expected);
    }
  },
});

Deno.test({
  name: "media_types - extensionsByType()",
  fn() {
    const fixtures: [string, string[] | undefined][] = [
      ["image/gif", ["gif"]],
      ["application/javascript", ["js", "mjs"]],
      ["text/html; charset=UTF-8", ["html", "htm", "shtml"]],
      ["application/foo", undefined],
    ];
    for (const [fixture, expected] of fixtures) {
      assertEquals(extensionsByType(fixture), expected);
    }
  },
});

Deno.test({
  name: "media_types - formatMediaType",
  fn() {
    const fixtures = [
      ["noslash", { X: "Y" }, "noslash; x=Y"],
      ["foo bar/baz", undefined, ""],
      ["foo/bar baz", undefined, ""],
      [
        "attachment",
        { filename: "ĄĄŽŽČČŠŠ" },
        "attachment; filename*=utf-8''%C4%84%C4%84%C5%BD%C5%BD%C4%8C%C4%8C%C5%A0%C5%A0",
      ],
      [
        "attachment",
        { filename: "ÁÁÊÊÇÇÎÎ" },
        "attachment; filename*=utf-8''%C3%81%C3%81%C3%8A%C3%8A%C3%87%C3%87%C3%8E%C3%8E",
      ],
      [
        "attachment",
        { filename: "数据统计.png" },
        "attachment; filename*=utf-8''%E6%95%B0%E6%8D%AE%E7%BB%9F%E8%AE%A1.png",
      ],
      ["foo/BAR", undefined, "foo/bar"],
      ["foo/BAR", { "X": "Y" }, "foo/bar; x=Y"],
      ["foo/BAR", { "space": "With space" }, `foo/bar; space="With space"`],
      ["foo/BAR", { "quote": `With "quote` }, `foo/bar; quote="With \\"quote"`],
      [
        "foo/BAR",
        { "bslash": `With \\backslash` },
        `foo/bar; bslash="With \\\\backslash"`,
      ],
      [
        "foo/BAR",
        { "both": `With \\backslash and "quote` },
        `foo/bar; both="With \\\\backslash and \\"quote"`,
      ],
      ["foo/BAR", { "": "empty attribute" }, ""],
      ["foo/BAR", { "bad attribute": "baz" }, ""],
      [
        "foo/BAR",
        { "nonascii": "not an ascii character: ä" },
        "foo/bar; nonascii*=utf-8''not%20an%20ascii%20character%3A%20%C3%A4",
      ],
      [
        "foo/BAR",
        { "ctl": "newline: \n nil: \0" },
        "foo/bar; ctl*=utf-8''newline%3A%20%0A%20nil%3A%20%00",
      ],
      [
        "foo/bar",
        { "a": "av", "b": "bv", "c": "cv" },
        "foo/bar; a=av; b=bv; c=cv",
      ],
      ["foo/bar", { "0": "'", "9": "'" }, "foo/bar; 0='; 9='"],
      ["foo", { "bar": "" }, `foo; bar=""`],
    ] as const;
    for (const [type, param, expected] of fixtures) {
      assertEquals(formatMediaType(type, param), expected);
    }
  },
});

Deno.test({
  name: "media-types - getCharset()",
  fn() {
    const fixtures = [
      ["text/plain", "UTF-8"],
      ["text/html", "UTF-8"],
      ["application/foo", undefined],
      ["application/news-checkgroups", "US-ASCII"],
      ["application/news-checkgroups; charset=UTF-8", "UTF-8"],
    ] as const;
    for (const [fixture, expected] of fixtures) {
      assertEquals(getCharset(fixture), expected);
    }
  },
});

Deno.test({
  name: "media_types - parseMediaType()",
  fn() {
    const nameFoo = { "name": "foo" };
    const fixtures: [string, string, Record<string, string> | undefined][] = [
      [`form-data; name="foo"`, "form-data", nameFoo],
      [` form-data ; name=foo`, "form-data", nameFoo],
      [`FORM-DATA;name="foo"`, "form-data", nameFoo],
      [` FORM-DATA ; name="foo"`, "form-data", nameFoo],
      [` FORM-DATA ; name="foo"`, "form-data", nameFoo],
      [`form-data; key=value;  blah="value";name="foo" `, "form-data", {
        key: "value",
        blah: "value",
        name: "foo",
      }],
      [
        `application/x-stuff; title*=us-ascii'en-us'This%20is%20%2A%2A%2Afun%2A%2A%2A`,
        "application/x-stuff",
        {
          title: "This is ***fun***",
        },
      ],
      [
        `message/external-body; access-type=URL; ` +
        `URL*0="ftp://";` +
        `URL*1="cs.utk.edu/pub/moore/bulk-mailer/bulk-mailer.tar"`,
        "message/external-body",
        {
          "access-type": "URL",
          url: "ftp://cs.utk.edu/pub/moore/bulk-mailer/bulk-mailer.tar",
        },
      ],
      [
        `application/x-stuff; ` +
        `title*0*=us-ascii'en'This%20is%20even%20more%20; ` +
        `title*1*=%2A%2A%2Afun%2A%2A%2A%20; ` +
        `title*2="isn't it!"`,
        `application/x-stuff`,
        {
          title: "This is even more ***fun*** isn't it!",
        },
      ],
      [`attachment`, "attachment", undefined],
      [`ATTACHMENT`, "attachment", undefined],
      [`attachment; filename="foo.html"`, "attachment", {
        filename: "foo.html",
      }],
      [`attachment; filename="f\\oo.html"`, "attachment", {
        filename: "f\\oo.html",
      }],
      [`attachment; filename="Here's a semicolon;.html"`, "attachment", {
        filename: "Here's a semicolon;.html",
      }],
      [`attachment; filename="foo-%c3%a4-%e2%82%ac.html"`, "attachment", {
        filename: "foo-%c3%a4-%e2%82%ac.html",
      }],
      [
        `attachment; filename*=''foo-%c3%a4-%e2%82%ac.html`,
        "attachment",
        undefined,
      ],
      [`attachment; filename*=UTF-8''foo-a%cc%88.html`, "attachment", {
        filename: "foo-ä.html",
      }],
      [`attachment; filename*0="foo."; filename*1="html"`, "attachment", {
        filename: "foo.html",
      }],
      [`form-data; firstname="Брэд"; lastname="Фицпатрик"`, "form-data", {
        firstname: "Брэд",
        lastname: "Фицпатрик",
      }],
      [
        `form-data; name="file"; filename="C:\\dev\\go\\robots.txt"`,
        "form-data",
        { name: "file", filename: `C:\\dev\\go\\robots.txt` },
      ],
      [
        `form-data; name="file"; filename="C:\\新建文件夹\\中文第二次测试.mp4"`,
        "form-data",
        { name: "file", filename: `C:\\新建文件夹\\中文第二次测试.mp4` },
      ],
    ];

    for (const [fixture, mediaType, params] of fixtures) {
      assertEquals(parseMediaType(fixture), [mediaType, params]);
    }
  },
});

Deno.test({
  name: "media_types - typeByExtension",
  fn() {
    const fixtures = [
      ["js", "application/javascript"],
      [".js", "application/javascript"],
      ["Js", "application/javascript"],
      ["html", "text/html"],
      [".html", "text/html"],
      [".HTML", "text/html"],
      ["file.json", undefined],
      ["foo", undefined],
      [".foo", undefined],
    ] as const;
    for (const [fixture, expected] of fixtures) {
      assertEquals(typeByExtension(fixture), expected);
    }
  },
});
