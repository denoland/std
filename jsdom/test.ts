import { JSDOM } from "./jsdom.ts";
import { assertEquals } from "../testing/asserts.ts";
import { test, runIfMain } from "../testing/mod.ts";

test(function helloWorld(): void {
  let dom = new JSDOM("<!DOCTYPE html><p>Hello world</p>");
  let text = dom.window.document.querySelector("p").textContent;
  assertEquals(text, "Hello world");
});

test(function runScripts(): void {
  let dom = new JSDOM(
    // eslint-disable-next-line max-len
    '<body><script>document.body.appendChild(document.createElement("hr"));</script></body>',
    { runScripts: "dangerously" }
  );
  let children = dom.window.document.body.children.length;
  assertEquals(children, 2);
});

test(function serialize(): void {
  let dom = new JSDOM("<!DOCTYPE html>hello");
  assertEquals(
    dom.serialize(),
    "<!DOCTYPE html><html><head></head><body>hello</body></html>"
  );
  assertEquals(
    dom.window.document.documentElement.outerHTML,
    "<html><head></head><body>hello</body></html>"
  );
});

test(function fragment(): void {
  let frag = JSDOM.fragment(`<p>Hello</p><p><strong>Hi!</strong>`);
  assertEquals(frag.childNodes.length, 2);
  assertEquals(frag.querySelector("strong").textContent, "Hi!");
});

runIfMain(import.meta);
