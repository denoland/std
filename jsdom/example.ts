import { JSDOM } from "./jsdom.ts";

let dom = new JSDOM(`
  <!DOCTYPE html>
  <p>Hello, Deno!</p>
`);
let p = dom.window.document.querySelector("p");
console.log(p.textContent); // => "Hello, Deno!"
