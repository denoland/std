// Copyright 2018-2025 the Deno authors. MIT license.
import { assert } from "@std/assert";
import { isGlob } from "./is_glob.ts";

Deno.test({
  name: "isGlob()",
  fn() {
    // should be true if valid glob pattern
    assert(isGlob("!foo.js"));
    assert(isGlob("*.js"));
    assert(isGlob("f?o.js"));
    assert(isGlob("!*.js"));
    assert(isGlob("!foo"));
    assert(isGlob("!foo.js"));
    assert(isGlob("**/abc.js"));
    assert(isGlob("abc/*.js"));
    assert(isGlob("@.(?:abc)"));
    assert(isGlob("@.(?!abc)"));

    // should be false if invalid glob pattern
    assert(!isGlob(""));
    assert(!isGlob("~/abc"));
    assert(!isGlob("~/abc"));
    assert(!isGlob("~/(abc)"));
    assert(!isGlob("+~(abc)"));
    assert(!isGlob("."));
    assert(!isGlob("@.(abc)"));
    assert(!isGlob("aa"));
    assert(!isGlob("abc!/def/!ghi.js"));
    assert(!isGlob("abc.js"));
    assert(!isGlob("abc/def/!ghi.js"));
    assert(!isGlob("abc/def/ghi.js"));

    // Should be true if path has regex capture group
    assert(isGlob("abc/(?!foo).js"));
    assert(isGlob("abc/(?:foo).js"));
    assert(isGlob("abc/(?=foo).js"));
    assert(isGlob("abc/(a|b).js"));
    assert(isGlob("abc/(a|b|c).js"));
    assert(isGlob("abc/(foo bar)/*.js"));

    // Should be false if the path has parens but is not a valid capture group
    assert(!isGlob("abc/(a b c).js"));
    assert(!isGlob("abc/(ab).js"));
    assert(!isGlob("abc/(abc).js"));
    assert(!isGlob("abc/(foo bar).js"));

    // should be false if the capture group is imbalanced
    assert(!isGlob("abc/(ab.js"));
    assert(!isGlob("abc/(a|b.js"));
    assert(!isGlob("abc/(a|b|c.js"));

    // should be true if the path has a regex character class
    assert(isGlob("abc/[abc].js"));
    assert(isGlob("abc/[^abc].js"));
    assert(isGlob("abc/[1-3].js"));

    // should be false if the character class is not balanced
    assert(!isGlob("abc/[abc.js"));
    assert(!isGlob("abc/[^abc.js"));
    assert(!isGlob("abc/[1-3.js"));

    // should be false if the character class is escaped
    assert(!isGlob("abc/\\[abc].js"));
    assert(!isGlob("abc/\\[^abc].js"));
    assert(!isGlob("abc/\\[1-3].js"));

    // should be true if the path has brace characters
    assert(isGlob("abc/{a,b}.js"));
    assert(isGlob("abc/{a..z}.js"));
    assert(isGlob("abc/{a..z..2}.js"));

    // should be false if (basic) braces are not balanced
    assert(!isGlob("abc/\\{a,b}.js"));
    assert(!isGlob("abc/\\{a..z}.js"));
    assert(!isGlob("abc/\\{a..z..2}.js"));

    // should be true if the path has regex characters
    assert(isGlob("!&(abc)"));
    assert(isGlob("!*.js"));
    assert(isGlob("!foo"));
    assert(isGlob("!foo.js"));
    assert(isGlob("**/abc.js"));
    assert(isGlob("*.js"));
    assert(isGlob("*z(abc)"));
    assert(isGlob("[1-10].js"));
    assert(isGlob("[^abc].js"));
    assert(isGlob("[a-j]*[^c]b/c"));
    assert(isGlob("[abc].js"));
    assert(isGlob("a/b/c/[a-z].js"));
    assert(isGlob("abc/(aaa|bbb).js"));
    assert(isGlob("abc/*.js"));
    assert(isGlob("abc/{a,b}.js"));
    assert(isGlob("abc/{a..z..2}.js"));
    assert(isGlob("abc/{a..z}.js"));

    assert(!isGlob("$(abc)"));
    assert(!isGlob("&(abc)"));

    // should be false if regex characters are escaped
    assert(!isGlob("\\?.js"));
    assert(!isGlob("\\[1-10\\].js"));
    assert(!isGlob("\\[^abc\\].js"));
    assert(!isGlob("\\[a-j\\]\\*\\[^c\\]b/c"));
    assert(!isGlob("\\[abc\\].js"));
    assert(!isGlob("\\a/b/c/\\[a-z\\].js"));
    assert(!isGlob("abc/\\(aaa|bbb).js"));
    assert(!isGlob("abc/\\?.js"));
  },
});
