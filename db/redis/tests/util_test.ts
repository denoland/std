import { parseURL } from "../mod.ts";
import { assertEquals } from "../../../testing/asserts.ts";
import { describe, it } from "../../../testing/bdd.ts";

describe("util", {
  permissions: {
    net: false,
    run: false,
  },
}, () => {
  describe("parseURL", () => {
    it("parses basic URL", () => {
      const options = parseURL("redis://127.0.0.1:7003");
      assertEquals(options.hostname, "127.0.0.1");
      assertEquals(options.port, 7003);
      assertEquals(options.tls, false);
      assertEquals(options.db, undefined);
      assertEquals(options.name, undefined);
      assertEquals(options.password, undefined);
    });

    it("parses complex URL", () => {
      const options = parseURL("rediss://username:password@127.0.0.1:7003/1");
      assertEquals(options.hostname, "127.0.0.1");
      assertEquals(options.port, 7003);
      assertEquals(options.tls, true);
      assertEquals(options.db, 1);
      assertEquals(options.name, "username");
      assertEquals(options.password, "password");
    });

    it("parses URL with search options", () => {
      const options = parseURL(
        "redis://127.0.0.1:7003/?db=2&password=password&ssl=true",
      );
      assertEquals(options.hostname, "127.0.0.1");
      assertEquals(options.port, 7003);
      assertEquals(options.tls, true);
      assertEquals(options.db, 2);
      assertEquals(options.name, undefined);
      assertEquals(options.password, "password");
    });

    it("checks parameter parsing priority", () => {
      const options = parseURL(
        "rediss://username:password@127.0.0.1:7003/1?db=2&password=password2&ssl=false",
      );
      assertEquals(options.hostname, "127.0.0.1");
      assertEquals(options.port, 7003);
      assertEquals(options.tls, true);
      assertEquals(options.db, 1);
      assertEquals(options.name, "username");
      assertEquals(options.password, "password");
    });
  });
});
