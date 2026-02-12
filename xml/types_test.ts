// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import {
  isCData,
  isComment,
  isElement,
  isText,
  XmlSyntaxError,
} from "./types.ts";
import type { XmlNode } from "./types.ts";

// =============================================================================
// Type Guards
// =============================================================================

Deno.test("isElement() returns true for element nodes", () => {
  const node: XmlNode = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [],
  };
  assertEquals(isElement(node), true);
});

Deno.test("isElement() returns false for non-element nodes", () => {
  const text: XmlNode = { type: "text", text: "hello" };
  const cdata: XmlNode = { type: "cdata", text: "data" };
  const comment: XmlNode = { type: "comment", text: "note" };

  assertEquals(isElement(text), false);
  assertEquals(isElement(cdata), false);
  assertEquals(isElement(comment), false);
});

Deno.test("isText() returns true for text nodes", () => {
  const node: XmlNode = { type: "text", text: "hello" };
  assertEquals(isText(node), true);
});

Deno.test("isText() returns false for non-text nodes", () => {
  const element: XmlNode = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [],
  };
  const cdata: XmlNode = { type: "cdata", text: "data" };
  const comment: XmlNode = { type: "comment", text: "note" };

  assertEquals(isText(element), false);
  assertEquals(isText(cdata), false);
  assertEquals(isText(comment), false);
});

Deno.test("isCData() returns true for CDATA nodes", () => {
  const node: XmlNode = { type: "cdata", text: "<script>" };
  assertEquals(isCData(node), true);
});

Deno.test("isCData() returns false for non-CDATA nodes", () => {
  const element: XmlNode = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [],
  };
  const text: XmlNode = { type: "text", text: "hello" };
  const comment: XmlNode = { type: "comment", text: "note" };

  assertEquals(isCData(element), false);
  assertEquals(isCData(text), false);
  assertEquals(isCData(comment), false);
});

Deno.test("isComment() returns true for comment nodes", () => {
  const node: XmlNode = { type: "comment", text: "A comment" };
  assertEquals(isComment(node), true);
});

Deno.test("isComment() returns false for non-comment nodes", () => {
  const element: XmlNode = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [],
  };
  const text: XmlNode = { type: "text", text: "hello" };
  const cdata: XmlNode = { type: "cdata", text: "data" };

  assertEquals(isComment(element), false);
  assertEquals(isComment(text), false);
  assertEquals(isComment(cdata), false);
});

// =============================================================================
// XmlSyntaxError
// =============================================================================

Deno.test("XmlSyntaxError contains position information", () => {
  const error = new XmlSyntaxError("Test error", {
    line: 5,
    column: 10,
    offset: 50,
  });

  assertEquals(error.line, 5);
  assertEquals(error.column, 10);
  assertEquals(error.offset, 50);
  assertEquals(error.name, "XmlSyntaxError");
  assertEquals(error.message, "Test error at line 5, column 10");
});

Deno.test("XmlSyntaxError is instanceof SyntaxError", () => {
  const error = new XmlSyntaxError("Test", { line: 1, column: 1, offset: 0 });
  assertEquals(error instanceof SyntaxError, true);
});

// =============================================================================
// Type Guard Usage with Filtering
// =============================================================================

Deno.test("type guards work for filtering arrays", () => {
  const nodes: XmlNode[] = [
    {
      type: "element",
      name: { raw: "a", local: "a" },
      attributes: {},
      children: [],
    },
    { type: "text", text: "hello" },
    { type: "cdata", text: "data" },
    { type: "comment", text: "note" },
    {
      type: "element",
      name: { raw: "b", local: "b" },
      attributes: {},
      children: [],
    },
  ];

  const elements = nodes.filter(isElement);
  const texts = nodes.filter(isText);
  const cdatas = nodes.filter(isCData);
  const comments = nodes.filter(isComment);

  assertEquals(elements.length, 2);
  assertEquals(texts.length, 1);
  assertEquals(cdatas.length, 1);
  assertEquals(comments.length, 1);

  // Type narrowing works - these should compile
  assertEquals(elements[0]?.name.local, "a");
  assertEquals(texts[0]?.text, "hello");
  assertEquals(cdatas[0]?.text, "data");
  assertEquals(comments[0]?.text, "note");
});
