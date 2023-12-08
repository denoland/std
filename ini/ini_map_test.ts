// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { IniMap } from "./mod.ts";
import { assertEquals, assertObjectMatch } from "../assert/mod.ts";

Deno.test({
  name: "IniMap",
  async fn({ step }) {
    const text = "#comment\nkeyA=1977-05-25\n[section1]\nkeyA=100";
    let ini = new IniMap();

    await step({
      name: "set() values",
      fn() {
        assertEquals(ini.size, 0);
        assertEquals(ini.set("section1", "keyA", null), ini);
        assertEquals(ini.set("keyA", true), ini);
        assertEquals(ini.set("section1", "keyA", 100), ini);
        assertEquals(ini.set("keyA", "1977-05-25"), ini);
        assertEquals(ini.size, 2);
      },
    });

    await step({
      name: "get() values",
      fn() {
        assertEquals(ini.get("section1", "keyA"), 100);
        assertEquals(ini.get("keyA"), "1977-05-25");
      },
    });

    await step({
      name: "delete() values",
      fn() {
        assertEquals(ini.delete("section1", "keyB"), false);
        assertEquals(ini.delete("keyB"), false);
        assertEquals(ini.delete("section1", "keyA"), true);
        assertEquals(ini.delete("keyA"), true);
      },
    });

    await step({
      name: "has() keys",
      fn() {
        assertEquals(ini.has("section1", "keyA"), false);
        assertEquals(ini.has("keyA"), false);
        ini.set("section1", "keyA", 100);
        ini.set("keyA", "1977-05-25");
        assertEquals(ini.has("section1", "keyA"), true);
        assertEquals(ini.has("keyA"), true);
      },
    });

    await step({
      name: "clear()",
      fn() {
        ini.clear("section1");
        assertEquals(ini.size, 1);
        assertEquals(ini.has("section1", "keyA"), false);
        ini.clear();
        assertEquals(ini.size, 0);
        assertEquals(ini.has("keyA"), false);
      },
    });

    await step({
      name: "entries()",
      fn() {
        ini.set("section1", "keyA", 100);
        ini.set("keyA", "1977-05-25");
        assertObjectMatch(
          Array.from(ini.entries()),
          // deno-lint-ignore no-explicit-any
          [["keyA", "1977-05-25"], ["keyA", 100, "section1"]] as any,
        );
      },
    });

    await step({
      name: "parse() INI string",
      fn() {
        ini = new IniMap();
        ini.parse(text);
        assertEquals(ini.get("section1", "keyA"), "100");
        assertEquals(ini.get("keyA"), "1977-05-25");
        ini.clear();
        ini.parse(
          text,
          (key, val, sec) =>
            sec === "section1" && key === "keyA" ? Number(val) : val,
        );
        assertEquals(ini.get("section1", "keyA"), 100);
        assertEquals(ini.get("keyA"), "1977-05-25");
      },
    });

    await step({
      name: "convert() to INI string",
      fn() {
        assertEquals(ini.toString(), text);
        assertEquals(
          ini.toString((key, val, sec) => key && sec ? "one hundred" : val),
          "#comment\nkeyA=1977-05-25\n[section1]\nkeyA=one hundred",
        );
      },
    });

    await step({
      name: "convert() to object",
      fn() {
        assertObjectMatch(ini.toObject(), {
          keyA: "1977-05-25",
          section1: { keyA: 100 },
        });
      },
    });

    await step({
      name: "convert() to JSON",
      fn() {
        assertEquals(
          JSON.stringify(ini),
          '{"keyA":"1977-05-25","section1":{"keyA":100}}',
        );
      },
    });

    await step({
      name: "from() creates ini from given inputs",
      fn() {
        assertEquals(
          IniMap.from("keyA=1977-05-25\n[section1]\nkeyA=100").toString(),
          IniMap.from({
            keyA: "1977-05-25",
            section1: { keyA: 100 },
          }).toString(),
        );
      },
    });

    await step({
      name: "from() detects unambiguous formatting marks",
      fn() {
        assertObjectMatch(IniMap.from("# comment\na = b").formatting, {
          commentChar: "#",
          lineBreak: "\n",
          pretty: true,
        });
        assertObjectMatch(IniMap.from("; comment\ra=b").formatting, {
          commentChar: ";",
          lineBreak: "\r",
          pretty: false,
        });
        assertObjectMatch(IniMap.from("// comment\r\na= b").formatting, {
          commentChar: "//",
          lineBreak: "\r\n",
          pretty: false,
        });
        assertObjectMatch(IniMap.from("# comment\n\ra =b").formatting, {
          commentChar: "#",
          lineBreak: "\n\r",
          pretty: false,
        });
      },
    });

    await step({
      name: "comments",
      async fn({ step }) {
        ini = IniMap.from({
          keyA: "1977-05-25",
          section1: { keyA: 100 },
        });

        await step({
          name: "set comments",
          fn() {
            assertEquals(
              ini.comments.setAtLine(4, "# set comment 1"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtLine(6, "without formatting mark"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtKey("keyA", "# set comment 2"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtKey("section1", "keyA", "# set comment 3"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtSection("section1", "# set comment 4"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtLine(7, "# modified comment 1"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtKey("keyA", "# modified comment 2"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtKey("section1", "keyA", "# modified comment 3"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtSection("section1", "# modified comment 4"),
              ini.comments,
            );
          },
        });

        await step({
          name: "get comments",
          fn() {
            assertEquals(ini.comments.getAtLine(7), "# modified comment 1");
            assertEquals(ini.comments.getAtLine(8), "");
            assertEquals(
              ini.comments.getAtLine(9),
              "# without formatting mark",
            );
            assertEquals(ini.comments.getAtKey("keyA"), "# modified comment 2");
            assertEquals(
              ini.comments.getAtKey("section1", "keyA"),
              "# modified comment 3",
            );
            assertEquals(
              ini.comments.getAtSection("section1"),
              "# modified comment 4",
            );
          },
        });

        await step({
          name: "delete comments",
          fn() {
            ini.comments.setAtLine(1, "# set comment 1");
            assertEquals(ini.comments.deleteAtLine(9), true);
            assertEquals(ini.comments.deleteAtLine(8), true);
            assertEquals(ini.comments.deleteAtLine(7), true);
            assertEquals(ini.comments.deleteAtKey("keyA"), true);
            assertEquals(ini.comments.deleteAtKey("section1", "keyA"), true);
            assertEquals(ini.comments.deleteAtSection("section1"), true);
            assertEquals(ini.comments.deleteAtLine(9), false);
            assertEquals(ini.comments.deleteAtLine(8), false);
            assertEquals(ini.comments.deleteAtLine(7), false);
            assertEquals(ini.comments.deleteAtKey("keyA"), false);
            assertEquals(ini.comments.deleteAtKey("section1", "keyA"), false);
            assertEquals(ini.comments.deleteAtSection("section1"), false);
            assertEquals(ini.comments.deleteAtKey("section1", "keyB"), false);
            assertEquals(ini.comments.deleteAtSection("section2"), false);
          },
        });

        await step({
          name: "clear comments",
          fn() {
            ini.comments.setAtLine(1, "# set comment 1");
            ini.comments.setAtKey("section1", "keyA", "# set comment 2");
            ini.comments.setAtSection("section1", "# set comment 3");
            assertEquals(
              ini.toString(),
              "# set comment 1\nkeyA=1977-05-25\n# set comment 3\n[section1]\n# set comment 2\nkeyA=100",
            );
            ini.comments.clear();
            assertEquals(
              ini.toString(),
              "keyA=1977-05-25\n[section1]\nkeyA=100",
            );
          },
        });

        await step({
          name: "preserve comments",
          fn() {
            const comment = "# comment";
            assertEquals(IniMap.from(comment).toString(), comment);
          },
        });
      },
    });
  },
});
