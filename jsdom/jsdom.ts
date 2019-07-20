import "./vendor/jsdom.js";

let JSDOM = (window as any).jsdom.JSDOM;
let dom = new JSDOM(`
  <!DOCTYPE html>
  <p>Hello, Deno!</p>
`);
let p = dom.window.document.querySelector("p");
console.log(p.textContent);
