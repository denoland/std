const { mkdir } = Deno;
type FileInfo = Deno.FileInfo;
import { test, runIfMain } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { glob, isGlob } from "./glob.ts";
import { join } from "./path.ts";
import { testWalk } from "./walk_test.ts";
import { touch, walkArray } from "./walk_test.ts";

test({
  name: "glob: glob to regex",
  fn(): void {
    assertEquals(glob("unicorn.*") instanceof RegExp, true);
    assertEquals(glob("unicorn.*").test("poney.ts"), false);
    assertEquals(glob("unicorn.*").test("unicorn.py"), true);
    assertEquals(glob("*.ts").test("poney.ts"), true);
    assertEquals(glob("*.ts").test("unicorn.js"), false);
    assertEquals(
      glob(join("unicorn", "**", "cathedral.ts")).test(
        join("unicorn", "in", "the", "cathedral.ts")
      ),
      true
    );
    assertEquals(
      glob(join("unicorn", "**", "cathedral.ts")).test(
        join("unicorn", "in", "the", "kitchen.ts")
      ),
      false
    );
    assertEquals(
      glob(join("unicorn", "**", "bathroom.*")).test(
        join("unicorn", "sleeping", "in", "bathroom.py")
      ),
      true
    );
    assertEquals(
      glob(join("unicorn", "!(sleeping)", "bathroom.ts"), {
        extended: true
      }).test(join("unicorn", "flying", "bathroom.ts")),
      true
    );
    assertEquals(
      glob(join("unicorn", "(!sleeping)", "bathroom.ts"), {
        extended: true
      }).test(join("unicorn", "sleeping", "bathroom.ts")),
      false
    );
  }
});

testWalk(
  async (d: string): Promise<void> => {
    await mkdir(d + "/a");
    await touch(d + "/a/x.ts");
  },
  async function globInWalk(): Promise<void> {
    const arr = await walkArray(".", { match: [glob("*.ts")] });
    assertEquals(arr.length, 1);
    assertEquals(arr[0], "a/x.ts");
  }
);

testWalk(
  async (d: string): Promise<void> => {
    await mkdir(d + "/a");
    await mkdir(d + "/b");
    await touch(d + "/a/x.ts");
    await touch(d + "/b/z.ts");
    await touch(d + "/b/z.js");
  },
  async function globInWalkWildcardFiles(): Promise<void> {
    const arr = await walkArray(".", { match: [glob("*.ts")] });
    assertEquals(arr.length, 2);
    assertEquals(arr[0], "a/x.ts");
    assertEquals(arr[1], "b/z.ts");
  }
);

testWalk(
  async (d: string): Promise<void> => {
    await mkdir(d + "/a");
    await mkdir(d + "/a/yo");
    await touch(d + "/a/yo/x.ts");
  },
  async function globInWalkFolderWildcard(): Promise<void> {
    const arr = await walkArray(".", {
      match: [
        glob(join("a", "**", "*.ts"), {
          flags: "g",
          globstar: true
        })
      ]
    });
    assertEquals(arr.length, 1);
    assertEquals(arr[0], "a/yo/x.ts");
  }
);

testWalk(
  async (d: string): Promise<void> => {
    await mkdir(d + "/a");
    await mkdir(d + "/a/unicorn");
    await mkdir(d + "/a/deno");
    await mkdir(d + "/a/raptor");
    await touch(d + "/a/raptor/x.ts");
    await touch(d + "/a/deno/x.ts");
    await touch(d + "/a/unicorn/x.ts");
  },
  async function globInWalkFolderExtended(): Promise<void> {
    const arr = await walkArray(".", {
      match: [
        glob(join("a", "+(raptor|deno)", "*.ts"), {
          flags: "g",
          extended: true
        })
      ]
    });
    assertEquals(arr.length, 2);
    assertEquals(arr[0], "a/deno/x.ts");
    assertEquals(arr[1], "a/raptor/x.ts");
  }
);

testWalk(
  async (d: string): Promise<void> => {
    await touch(d + "/x.ts");
    await touch(d + "/x.js");
    await touch(d + "/b.js");
  },
  async function globInWalkWildcardExtension(): Promise<void> {
    const arr = await walkArray(".", {
      match: [glob("x.*", { flags: "g", globstar: true })]
    });
    console.log(arr);
    assertEquals(arr.length, 2);
    assertEquals(arr[0], "x.js");
    assertEquals(arr[1], "x.ts");
  }
);

test({
  name: "isGlob: pattern to test",
  fn(): void {
    // should be true if valid glob pattern
    assertEquals(isGlob("!foo.js"), true);
    assertEquals(isGlob("*.js"), true);
    assertEquals(isGlob("!*.js"), true);
    assertEquals(isGlob("!foo"), true);
    assertEquals(isGlob("!foo.js"), true);
    assertEquals(isGlob("**/abc.js"), true);
    assertEquals(isGlob("abc/*.js"), true);
    assertEquals(isGlob("@.(?:abc)"), true);
    assertEquals(isGlob("@.(?!abc)"), true);

    // should be false if invalid glob pattern
    assertEquals(!isGlob(""), true);
    assertEquals(!isGlob(""), true);
    assertEquals(!isGlob("~/abc"), true);
    assertEquals(!isGlob("~/abc"), true);
    assertEquals(!isGlob("~/(abc)"), true);
    assertEquals(!isGlob("+~(abc)"), true);
    assertEquals(!isGlob("."), true);
    assertEquals(!isGlob("@.(abc)"), true);
    assertEquals(!isGlob("aa"), true);
    assertEquals(!isGlob("who?"), true);
    assertEquals(!isGlob("why!?"), true);
    assertEquals(!isGlob("where???"), true);
    assertEquals(!isGlob("abc!/def/!ghi.js"), true);
    assertEquals(!isGlob("abc.js"), true);
    assertEquals(!isGlob("abc/def/!ghi.js"), true);
    assertEquals(!isGlob("abc/def/ghi.js"), true);

    // Should be true if path has regex capture group
    assertEquals(isGlob("abc/(?!foo).js"), true);
    assertEquals(isGlob("abc/(?:foo).js"), true);
    assertEquals(isGlob("abc/(?=foo).js"), true);
    assertEquals(isGlob("abc/(a|b).js"), true);
    assertEquals(isGlob("abc/(a|b|c).js"), true);
    assertEquals(isGlob("abc/(foo bar)/*.js"), true);

    // Should be false if the path has parens but is not a valid capture group
    assertEquals(!isGlob("abc/(?foo).js"), true);
    assertEquals(!isGlob("abc/(a b c).js"), true);
    assertEquals(!isGlob("abc/(ab).js"), true);
    assertEquals(!isGlob("abc/(abc).js"), true);
    assertEquals(!isGlob("abc/(foo bar).js"), true);

    // should be false if the capture group is imbalanced
    assertEquals(!isGlob("abc/(?ab.js"), true);
    assertEquals(!isGlob("abc/(ab.js"), true);
    assertEquals(!isGlob("abc/(a|b.js"), true);
    assertEquals(!isGlob("abc/(a|b|c.js"), true);

    // should be true if the path has a regex character class
    assertEquals(isGlob("abc/[abc].js"), true);
    assertEquals(isGlob("abc/[^abc].js"), true);
    assertEquals(isGlob("abc/[1-3].js"), true);

    // should be false if the character class is not balanced
    assertEquals(!isGlob("abc/[abc.js"), true);
    assertEquals(!isGlob("abc/[^abc.js"), true);
    assertEquals(!isGlob("abc/[1-3.js"), true);

    // should be false if the character class is escaped
    assertEquals(!isGlob("abc/\\[abc].js"), true);
    assertEquals(!isGlob("abc/\\[^abc].js"), true);
    assertEquals(!isGlob("abc/\\[1-3].js"), true);

    // should be true if the path has brace characters
    assertEquals(isGlob("abc/{a,b}.js"), true);
    assertEquals(isGlob("abc/{a..z}.js"), true);
    assertEquals(isGlob("abc/{a..z..2}.js"), true);

    // should be false if (basic) braces are not balanced
    assertEquals(!isGlob("abc/\\{a,b}.js"), true);
    assertEquals(!isGlob("abc/\\{a..z}.js"), true);
    assertEquals(!isGlob("abc/\\{a..z..2}.js"), true);

    // should be true if the path has regex characters
    assertEquals(isGlob("!&(abc)"), true);
    assertEquals(isGlob("!*.js"), true);
    assertEquals(isGlob("!foo"), true);
    assertEquals(isGlob("!foo.js"), true);
    assertEquals(isGlob("**/abc.js"), true);
    assertEquals(isGlob("*.js"), true);
    assertEquals(isGlob("*z(abc)"), true);
    assertEquals(isGlob("[1-10].js"), true);
    assertEquals(isGlob("[^abc].js"), true);
    assertEquals(isGlob("[a-j]*[^c]b/c"), true);
    assertEquals(isGlob("[abc].js"), true);
    assertEquals(isGlob("a/b/c/[a-z].js"), true);
    assertEquals(isGlob("abc/(aaa|bbb).js"), true);
    assertEquals(isGlob("abc/*.js"), true);
    assertEquals(isGlob("abc/{a,b}.js"), true);
    assertEquals(isGlob("abc/{a..z..2}.js"), true);
    assertEquals(isGlob("abc/{a..z}.js"), true);

    assertEquals(!isGlob("$(abc)"), true);
    assertEquals(!isGlob("&(abc)"), true);
    assertEquals(!isGlob("Who?.js"), true);
    assertEquals(!isGlob("? (abc)"), true);
    assertEquals(!isGlob("?.js"), true);
    assertEquals(!isGlob("abc/?.js"), true);

    // should be false if regex characters are escaped
    assertEquals(!isGlob("\\?.js"), true);
    assertEquals(!isGlob("\\[1-10\\].js"), true);
    assertEquals(!isGlob("\\[^abc\\].js"), true);
    assertEquals(!isGlob("\\[a-j\\]\\*\\[^c\\]b/c"), true);
    assertEquals(!isGlob("\\[abc\\].js"), true);
    assertEquals(!isGlob("\\a/b/c/\\[a-z\\].js"), true);
    assertEquals(!isGlob("abc/\\(aaa|bbb).js"), true);
    assertEquals(!isGlob("abc/\\?.js"), true);
  }
});

runIfMain(import.meta);
