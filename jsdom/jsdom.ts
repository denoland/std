import "./vendor/jsdom.js";

// TODO: Investigate how to reuse typings from:
// - https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/jsdom/index.d.ts
// - https://github.com/microsoft/TypeScript/blob/master/lib/lib.dom.d.ts

interface JSDOM {
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  new (html: string, options?: { runScripts?: "dangerously" }): JSDOM;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly window: any;
  fragment: (html: string) => any;
  serialize(): string;
}

export let JSDOM = (window as any).jsdom.JSDOM as JSDOM;
