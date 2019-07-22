import { JSDOM } from "./jsdom.ts";
import { assertEquals } from "../testing/asserts.ts";
import { test, runIfMain } from "../testing/mod.ts";

// TODO: Add proper tests. All tests are copied from
// JSDOM's readme (https://github.com/jsdom/jsdom).

test(function helloWorld() {
  let dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
  let text = dom.window.document.querySelector("p").textContent;
  assertEquals(text, "Hello world");
});

test(function runScripts() {
  let dom = new JSDOM(
    `<body>
  <script>document.body.appendChild(document.createElement("hr"));</script>
</body>`,
    { runScripts: "dangerously" }
  );
  let children = dom.window.document.body.children.length;
  assertEquals(children, 2);
});

test(function fragment() {
  let frag = JSDOM.fragment(`<p>Hello</p><p><strong>Hi!</strong>`);
  assertEquals(frag.childNodes.length, 2);
  assertEquals(frag.querySelector("strong").textContent, "Hi!");
});

runIfMain(import.meta);
