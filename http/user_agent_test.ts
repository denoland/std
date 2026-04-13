// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { UserAgent } from "./user_agent.ts";

Deno.test({
  name: "UserAgent.prototype.browser",
  async fn(t) {
    const specs = (await import("./testdata/user_agent/browser-all.json", {
      with: { type: "json" },
    })).default;
    for (const { desc, ua, expect: { major, name, version } } of specs) {
      await t.step({
        name: desc,
        fn() {
          const actual = new UserAgent(ua);
          assertEquals(actual.browser, {
            major: major === "undefined" ? undefined : major,
            name: name === "undefined" ? undefined : name,
            version: version === "undefined" ? undefined : version,
          });
        },
      });
    }
  },
});

Deno.test({
  name: "UserAgent.prototype.cpu",
  async fn(t) {
    const specs = (await import("./testdata/user_agent/cpu-all.json", {
      with: { type: "json" },
    })).default;
    for (const { desc: name, ua, expect } of specs) {
      await t.step({
        name,
        fn() {
          const actual = new UserAgent(ua);
          assertEquals(actual.cpu, expect);
        },
      });
    }
  },
});

Deno.test({
  name: "UserAgent.prototype.device",
  async fn(t) {
    const specs = (await import("./testdata/user_agent/device-all.json", {
      with: { type: "json" },
    })).default;
    for (const { desc: name, ua, expect: { vendor, model, type } } of specs) {
      await t.step({
        name,
        fn() {
          const actual = new UserAgent(ua);
          assertEquals(actual.device, {
            vendor: vendor === "undefined" ? undefined : vendor,
            model: model === "undefined" ? undefined : model,
            type: type === "undefined" ? undefined : type,
          });
        },
      });
    }
  },
});

Deno.test({
  name: "UserAgent.prototype.engine",
  async fn(t) {
    const specs = (await import("./testdata/user_agent/engine-all.json", {
      with: { type: "json" },
    })).default;
    for (const { desc, ua, expect: { name, version } } of specs) {
      await t.step({
        name: desc,
        fn() {
          const actual = new UserAgent(ua);
          assertEquals(actual.engine, {
            name: name === "undefined" ? undefined : name,
            version: version === "undefined" ? undefined : version,
          });
        },
      });
    }
  },
});

Deno.test({
  name: "UserAgent.prototype.os",
  async fn(t) {
    const specs = (await import("./testdata/user_agent/os-all.json", {
      with: { type: "json" },
    })).default;
    for (const { desc, ua, expect: { name, version } } of specs) {
      await t.step({
        name: desc,
        fn() {
          const actual = new UserAgent(ua);
          assertEquals(actual.os, {
            name: name === "undefined" ? undefined : name,
            version: version === "undefined" ? undefined : version,
          });
        },
      });
    }
  },
});

Deno.test("UserAgent.constructor() accepts null", () => {
  const ua = new UserAgent(null);
  assertEquals(ua.ua, "");
  assertEquals(ua.browser, {
    name: undefined,
    version: undefined,
    major: undefined,
  });
  assertEquals(ua.cpu, { architecture: undefined });
  assertEquals(ua.device, {
    model: undefined,
    type: undefined,
    vendor: undefined,
  });
  assertEquals(ua.engine, { name: undefined, version: undefined });
  assertEquals(ua.os, { name: undefined, version: undefined });
});

Deno.test("UserAgent.toString() returns ua itself", () => {
  const ua = new UserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36",
  );
  assertEquals(ua.toString(), ua.ua);
});

Deno.test("UserAgent.toJSON() returns the object { browser, cpu, device, engine, os, ua }", () => {
  const ua = new UserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36",
  );
  assertEquals(ua.toJSON(), {
    browser: { name: "Chrome", version: "64.0.3282.140", major: "64" },
    cpu: { architecture: "amd64" },
    device: { model: undefined, type: undefined, vendor: undefined },
    engine: { name: "Blink", version: "64.0.3282.140" },
    os: { name: "Linux", version: "x86_64" },
    ua:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36",
  });
});

Deno.test("UserAgent supports custom inspect in Deno", () => {
  const ua = new UserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36",
  );
  assertEquals(
    Deno.inspect(ua),
    `UserAgent {
  browser: { name: "Chrome", version: "64.0.3282.140", major: "64" },
  cpu: { architecture: "amd64" },
  device: { model: undefined, type: undefined, vendor: undefined },
  engine: { name: "Blink", version: "64.0.3282.140" },
  os: { name: "Linux", version: "x86_64" },
  ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36"
}`,
  );
});

Deno.test("UserAgent supports custom inspect in Node.js", async () => {
  const { inspect } = await import("node:util");

  const ua = new UserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36",
  );
  // Needs to delete Deno.customInspect to enable Node's inspect
  // deno-lint-ignore no-explicit-any
  (ua as any)[Symbol.for("Deno.customInspect")] = undefined;
  assertEquals(
    inspect(ua),
    `UserAgent {
  browser: { name: 'Chrome', version: '64.0.3282.140', major: '64' },
  cpu: { architecture: 'amd64' },
  device: { model: undefined, type: undefined, vendor: undefined },
  engine: { name: 'Blink', version: '64.0.3282.140' },
  os: { name: 'Linux', version: 'x86_64' },
  ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36'
}`,
  );
  assertEquals(
    inspect(ua, { depth: null }),
    `UserAgent {
  browser: { name: 'Chrome', version: '64.0.3282.140', major: '64' },
  cpu: { architecture: 'amd64' },
  device: { model: undefined, type: undefined, vendor: undefined },
  engine: { name: 'Blink', version: '64.0.3282.140' },
  os: { name: 'Linux', version: 'x86_64' },
  ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36'
}`,
  );
  assertEquals(
    inspect([[ua]], { depth: 1 }),
    `[ [ [UserAgent] ] ]`,
  );
});
