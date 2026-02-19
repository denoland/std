// Copyright 2018-2026 the Deno authors. MIT license.
import { assert, assertEquals, assertThrows } from "@std/assert";
import { parse } from "./mod.ts";

Deno.test({
  name: "parse() handles error message",
  fn() {
    assertThrows(
      () => parse("foo = 1\nbar ="),
      SyntaxError,
      "line 2, column 5",
    );
    assertThrows(
      () => parse("foo = 1\nbar = 'foo\nbaz=1"),
      SyntaxError,
      "line 2, column 10",
    );
  },
});

Deno.test({
  name: "parse() handles strings",
  fn() {
    const expected = {
      strings: {
        str0: "deno",
        str1: "Roses are not Deno\n          Violets are not Deno either",
        str2: "Roses are not Deno\nViolets are not Deno either",
        str3: "Roses are not Deno\r\nViolets are not Deno either",
        str4: 'this is a "quote"',
        str5: "The quick brown fox jumps over the lazy dog.",
        str6: "The quick brown fox jumps over the lazy dog.",
        str7: "Roses are red\tViolets are blue",
        str8: "Roses are red\fViolets are blue",
        str9: "Roses are red\bViolets are blue",
        str10: "Roses are red\\Violets are blue",
        str11: `double "quote"\nsingle 'quote'\n`,
        str12: 'Here are two quotation marks: "". Simple enough.',
        str13: 'Here are three quotation marks: """.',
        str14: 'Here are fifteen quotation marks: """"""""""""""".',
        str15: '"This," she said, "is just a pointless statement."',
        literal1:
          "The first newline is\ntrimmed in raw strings.\n   All other whitespace\n   is preserved.\n",
        literal2: '"\\n#=*{',
        literal3: "\\n\\t is 'literal'\\\n",
        literal4: 'Here are fifteen quotation marks: """""""""""""""',
        literal5: "Here are fifteen apostrophes: '''''''''''''''",
        literal6: "'That,' she said, 'is still pointless.'",
        withApostrophe: "What if it's not?",
        withSemicolon: `const message = 'hello world';`,
        withHexNumberLiteral:
          "Prevent bug from stripping string here ->0xabcdef",
        withUnicodeChar1: "あ",
        withUnicodeChar2: "Deno🦕",
      },
    };
    const actual = parse(`[strings]
str0 = "deno"
str1 = """
Roses are not Deno
          Violets are not Deno either"""
# On a Unix system, the above multi-line string will most likely be the same as:
str2 = "Roses are not Deno\\nViolets are not Deno either"

# On a Windows system, it will most likely be equivalent to:
str3 = "Roses are not Deno\\r\\nViolets are not Deno either"
str4 = "this is a \\"quote\\""

str5 = """
The quick brown \\


  fox jumps over \\
    the lazy dog."""

str6 = """\\
       The quick brown \\
       fox jumps over \\
       the lazy dog.\\
       """
str7 = "Roses are red\\tViolets are blue"
str8 = "Roses are red\\fViolets are blue"
str9 = "Roses are red\\bViolets are blue"
str10 = "Roses are red\\\\Violets are blue"
str11 = """
double "quote"
single 'quote'
"""
str12 = """Here are two quotation marks: "". Simple enough."""
str13 = """Here are three quotation marks: ""\\"."""
str14 = """Here are fifteen quotation marks: ""\\"""\\"""\\"""\\"""\\"."""
str15 = """"This," she said, "is just a pointless statement.""""

literal1  = '''
The first newline is
trimmed in raw strings.
   All other whitespace
   is preserved.
'''

literal2 = '"\\n#=*{'
literal3 = '''
\\n\\t is 'literal'\\
'''
literal4 = '''Here are fifteen quotation marks: """""""""""""""'''
literal5 = "Here are fifteen apostrophes: '''''''''''''''"
literal6 = ''''That,' she said, 'is still pointless.''''

withApostrophe = "What if it's not?"
withSemicolon = "const message = 'hello world';"
withHexNumberLiteral = "Prevent bug from stripping string here ->0xabcdef"
withUnicodeChar1 = "\\u3042"
withUnicodeChar2 = "Deno\\U0001F995"
`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "handles empty string",
  fn() {
    assertEquals(parse(""), {});
    assertEquals(parse(" "), {});
    assertEquals(parse("\t"), {});
    assertEquals(parse("\r\n"), {});
    assertEquals(parse("\n"), {});
  },
});

Deno.test({
  name: "parse() handles CRLF",
  fn() {
    const expected = { boolean: { bool1: true, bool2: false } };
    const actual = parse(`[boolean]\r
bool1 = true\r
bool2 = false`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles boolean",
  fn() {
    const expected = { boolean: { bool1: true, bool2: false, bool3: true } };
    const actual = parse(`[boolean] # i hate comments
bool1 = true
bool2 = false
bool3 = true # I love comments`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles integer",
  fn() {
    const expected = {
      integer: {
        int1: 99,
        int2: 42,
        int3: 0,
        int4: -17,
        int5: 1000,
        int6: 5349221,
        int7: 12345,
        hex1: 0xDEADBEEF,
        hex2: 0xdead_beef,
        hex3: 0xdeadbeef,
        oct1: 0o01234567,
        oct2: 0o755,
        bin1: 0b11010110,
      },
    };
    const actual = parse(`[integer]
int1 = +99
int2 = 42
int3 = 0
int4 = -17
int5 = 1_000
int6 = 5_349_221
int7 = 1_2_3_4_5     # VALID but discouraged

# hexadecimal with prefix \`0x\`
hex1 = 0xDEADBEEF
hex2 = 0xdeadbeef
hex3 = 0xdead_beef

# octal with prefix \`0o\`
oct1 = 0o01234567
oct2 = 0o755 # useful for Unix file permissions

# binary with prefix \`0b\`
bin1 = 0b11010110`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles float",
  fn() {
    const expected = {
      float: {
        flt1: 1.0,
        flt2: 3.1415,
        flt3: -0.01,
        flt4: 5e22,
        flt5: 1e6,
        flt6: -2e-2,
        flt7: 6.626e-34,
        flt8: 224_617.445_991_228,
        sf1: Infinity,
        sf2: Infinity,
        sf3: -Infinity,
        sf4: NaN,
        sf5: NaN,
        sf6: NaN,
      },
    };
    const actual = parse(`[float]
# fractional
flt1 = +1.0 # Comment
flt2 = 3.1415 # Comment
flt3 = -0.01 # Comment

# exponent
flt4 = 5e+22 # Comment
flt5 = 1e6 # Comment
flt6 = -2E-2 # Comment

# both
flt7 = 6.626e-34 # Comment
flt8 = 224_617.445_991_228 # Comment
# infinity
sf1 = inf  # positive infinity
sf2 = +inf # positive infinity
sf3 = -inf # negative infinity

# not a number
sf4 = nan  # actual sNaN/qNaN encoding is implementation specific
sf5 = +nan # same as \`nan\`
sf6 = -nan # valid, actual encoding is implementation specific`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles arrays",
  fn() {
    const expected = {
      arrays: {
        data: [
          ["gamma", "delta"],
          [1, 2],
        ],
        floats: [
          0.1,
          -1.25,
        ],
        hosts: ["alpha", "omega"],
        profiles: [
          {
            "john@example.com": true,
            name: "John",
          },
          {
            "doe@example.com": true,
            name: "Doe",
          },
        ],
      },
    };
    const actual = parse(`[arrays]
data = [ ["gamma", "delta"], [1, 2] ] # comment after an array caused issue #7072

# Line breaks are OK when inside arrays
hosts = [
  "alpha",
  "omega"
] # comment

profiles = [ { name = "John", "john@example.com" = true }, { name = "Doe", "doe@example.com" = true }, ]

floats = [ 0.1, -1.25 ]`);

    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles table",
  fn() {
    const expected = {
      deeply: {
        nested: {
          object: {
            in: {
              the: {
                toml: {
                  name: "Tom Preston-Werner",
                },
              },
            },
          },
        },
      },
      servers: {
        alpha: {
          ip: "10.0.0.1",
          dc: "eqdc10",
        },
        beta: {
          ip: "10.0.0.2",
          dc: "eqdc20",
        },
      },
      dog: {
        "tater.man": {
          type: {
            name: "pug",
          },
        },
      },
    };
    const actual = parse(`[deeply.nested.object.in.the.toml]
name = "Tom Preston-Werner"

[servers]

  # Indentation (tabs and/or spaces) is allowed but not required
  [servers.alpha]
  ip = "10.0.0.1"
  dc = "eqdc10"

  [servers.beta]
  ip = "10.0.0.2"
  dc = "eqdc20"

# Naming rules for tables are the same as for keys
[dog."tater.man"]
type.name = "pug"
`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles various keys",
  fn() {
    const expected = {
      site: { "google.com": { bar: 1, baz: 1 } },
      a: { b: { c: 1, d: 1 }, e: 1 },
      "": 1,
      "127.0.0.1": 1,
      "ʎǝʞ": 1,
      'this is "literal"': 1,
      'double "quote"': 1,
      "basic__\n__": 1,
      "literal__\\n__": 1,
    };
    const actual = parse(`"" = 1
"127.0.0.1" = 1
"ʎǝʞ" = 1
'this is "literal"' = 1
"double \\"quote\\"" = 1

site."google.com".bar = 1
site."google.com".baz = 1

a . b . c = 1
a . b . d = 1
a . e = 1

'literal__\\n__' = 1
"basic__\\n__" = 1
`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles simple",
  fn() {
    const expected = {
      deno: "is",
      not: "[node]",
      regex: "<\\i\\c*\\s*>",
      NANI: "何?!",
      comment: "Comment inside # the comment",
    };
    const actual = parse(`deno = "is"
not = "[node]"
regex = '<\\i\\c*\\s*>'
NANI = '何?!'
comment = "Comment inside # the comment" # Comment
`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles datetime",
  fn() {
    const expected = {
      datetime: {
        odt1: new Date("1979-05-27T07:32:00Z"),
        odt2: new Date("1979-05-27T00:32:00-07:00"),
        odt3: new Date("1979-05-27T14:32:00+07:00"),
        odt4: new Date("1979-05-27T00:32:00.999999-07:00"),
        odt5: new Date("1979-05-27 07:32:00Z"),
        ld1: new Date("1979-05-27"),
        lt1: "07:32:00",
        lt2: "00:32:00.999999",
      },
    };
    const actual = parse(`[datetime]
odt1 = 1979-05-27T07:32:00Z # Comment
odt2 = 1979-05-27T00:32:00-07:00 # Comment
odt3 = 1979-05-27T14:32:00+07:00 # Comment
odt4 = 1979-05-27T00:32:00.999999-07:00 # Comment
odt5 = 1979-05-27 07:32:00Z # Comment
ld1 = 1979-05-27 # Comment
lt1 = 07:32:00 # Comment
lt2 = 00:32:00.999999 # Comment
`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles inline table",
  fn() {
    const expected = {
      inlinetable: {
        nile: {
          also: {
            malevolant: {
              creation: {
                drum: {
                  kit: "Tama",
                },
              },
            },
          },
          derek: {
            roddy: "drummer",
          },
        },
        name: {
          first: "Tom",
          last: "Preston-Werner",
        },
        point: {
          x: 1,
          y: 2,
        },
        dog: {
          type: {
            name: "pug",
          },
        },
        "tosin.abasi": "guitarist",
        animal: {
          as: {
            leaders: "tosin",
          },
        },
        annotation_filter: { "kubernetes.io/ingress.class": "nginx" },
        literal_key: {
          "foo\\nbar": "foo\\nbar",
        },
        nested: {
          parent: {
            "child.ren": [
              "[",
              "]",
            ],
            children: [
              "{",
              "}",
            ],
          },
        },
        empty: {},
      },
    };

    const actual = parse(`[inlinetable]
name = { first = "Tom", last = "Preston-Werner" }
point = { x = 1, y = 2 }
dog = { type = { name = "pug" } }
animal.as.leaders = "tosin"
"tosin.abasi" = "guitarist"
nile = { derek.roddy = "drummer", also = { malevolant.creation = { drum.kit = "Tama" } } }
annotation_filter = { "kubernetes.io/ingress.class" = "nginx" }
literal_key = { 'foo\\nbar' = 'foo\\nbar' }
nested = { parent = { children = ["{", "}"], "child.ren" = ["[", "]"] } } # comment
empty = {}
`);

    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles array of tables",
  fn() {
    const expected = {
      bin: [
        { name: "deno", path: "cli/main.rs" },
        { name: "deno_core", path: "src/foo.rs" },
      ],
      nib: [{ name: "node", path: "not_found" }],
      a: {
        c: {
          z: "z",
        },
      },
      b: [
        {
          c: {
            z: "z",
          },
        },
        {
          c: {
            z: "z",
          },
        },
      ],
      aaa: [
        {
          bbb: {
            asdf: "asdf",
          },
          hi: "hi",
        },
      ],
    };
    const actual = parse(`
[[bin]]
name = "deno"
path = "cli/main.rs"

[[bin]]
name = "deno_core"
path = "src/foo.rs"

[[nib]]
name = "node"
path = "not_found"

[a]
[a.c]
z = "z"

[[b]]
[b.c]
z = "z"

[[b]]
[b.c]
z = "z"

[[aaa]]
hi = "hi"
[aaa.bbb]
asdf = "asdf"`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles cargo",
  fn() {
    const expected = {
      workspace: { members: ["./", "core"] },
      bin: [{ name: "deno", path: "cli/main.rs" }],
      package: { name: "deno", version: "0.3.4", edition: "2018" },
      dependencies: {
        deno_core: { path: "./core" },
        atty: "0.2.11",
        dirs: "1.0.5",
        flatbuffers: "0.5.0",
        futures: "0.1.25",
        getopts: "0.2.18",
        http: "0.1.16",
        hyper: "0.12.24",
        "hyper-rustls": "0.16.0",
        "integer-atomics": "1.0.2",
        lazy_static: "1.3.0",
        libc: "0.2.49",
        log: "0.4.6",
        rand: "0.6.5",
        regex: "1.1.0",
        remove_dir_all: "0.5.2",
        ring: "0.14.6",
        rustyline: "3.0.0",
        serde_json: "1.0.38",
        "source-map-mappings": "0.5.0",
        tempfile: "3.0.7",
        tokio: "0.1.15",
        "tokio-executor": "0.1.6",
        "tokio-fs": "0.1.5",
        "tokio-io": "0.1.11",
        "tokio-process": "0.2.3",
        "tokio-threadpool": "0.1.11",
        url: "1.7.2",
      },
      target: {
        "cfg(windows)": { dependencies: { winapi: "0.3.6" } },
        "cfg(linux)": { dependencies: { winapi: "0.3.9" } },
      },
    };
    const actual = parse(
      `# Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
# Dummy package info required by \`cargo fetch\`.

[workspace]
members = [
  "./",
  "core",
]

[[bin]]
name = "deno"
path = "cli/main.rs"

[package]
name = "deno"
version = "0.3.4"
edition = "2018"

[dependencies]
deno_core = { path = "./core" }

atty = "0.2.11"
dirs = "1.0.5"
flatbuffers = "0.5.0"
futures = "0.1.25"
getopts = "0.2.18"
http = "0.1.16"
hyper = "0.12.24"
hyper-rustls = "0.16.0"
integer-atomics = "1.0.2"
lazy_static = "1.3.0"
libc = "0.2.49"
log = "0.4.6"
rand = "0.6.5"
regex = "1.1.0"
remove_dir_all = "0.5.2"
ring = "0.14.6"
rustyline = "3.0.0"
serde_json = "1.0.38"
source-map-mappings = "0.5.0"
tempfile = "3.0.7"
tokio = "0.1.15"
tokio-executor = "0.1.6"
tokio-fs = "0.1.5"
tokio-io = "0.1.11"
tokio-process = "0.2.3"
tokio-threadpool = "0.1.11"
url = "1.7.2"

[target.'cfg(windows)'.dependencies]
winapi = "0.3.6"

[target."cfg(linux)".dependencies]
winapi = "0.3.9"
`,
    );
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles comments",
  fn: () => {
    const expected = {
      str0: "value",
      str1: "# This is not a comment",
      str2:
        " # this is not a comment!\nA multiline string with a #\n# this is also not a comment\n",
      str3:
        '"# not a comment"\n\t# this is a real tab on purpose \n# not a comment\n',
      point0: { x: 1, y: 2, str0: "#not a comment", z: 3 },
      point1: { x: 7, y: 8, z: 9, str0: "#not a comment" },
      deno: {
        features: ["#secure by default", "supports typescript # not a comment"],
        url: "https://deno.land/",
        is_not_node: true,
      },
      toml: {
        name: "Tom's Obvious, Minimal Language",
        objectives: ["easy to read", "minimal config file", "#not a comment"],
      },
    };
    const actual = parse(`# This is a full-line comment
 # Comment line starting with whitespaces (#823 case 3) foo = "..."
str0 = 'value' # This is a comment at the end of a line
str1 = "# This is not a comment" # but this is
str2 = """ # this is not a comment!
A multiline string with a #
# this is also not a comment
""" # this is definitely a comment

str3 = '''
"# not a comment"
	# this is a real tab on purpose 
# not a comment
''' # comment

point0 = { x = 1, y = 2, str0 = "#not a comment", z = 3 } # comment
point1 = { x = 7, y = 8, z = 9, str0 = "#not a comment"} # comment

[deno] # this comment is fine
features = ["#secure by default", "supports typescript # not a comment"] # Comment caused Issue #7072
url = "https://deno.land/" # comment
is_not_node = true # comment

# """
# '''

[toml] # Comment caused Issue #7072 (case 2)
name = "Tom's Obvious, Minimal Language"
objectives = [ # Comment
 "easy to read", # Comment
 "minimal config file", 
 "#not a comment" # comment
] # comment
`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles inline array of inline table",
  fn() {
    const expected = {
      inlineArray: {
        string: [{ var: "a string" }],
        my_points: [
          { x: 1, y: 2, z: 3 },
          { x: 7, y: 8, z: 9 },
          { x: 2, y: 4, z: 8 },
        ],
        points: [
          { x: 1, y: 2, z: 3 },
          { x: 7, y: 8, z: 9 },
          { x: 2, y: 4, z: 8 },
        ],
      },
    };
    const actual = parse(`[inlineArray]
string = [ {var = "a string"} ]

my_points = [ { x = 1, y = 2, z = 3 }, { x = 7, y = 8, z = 9 }, { x = 2, y = 4, z = 8 } ]

points = [ { x = 1, y = 2, z = 3 }, # comment ]
    { x = 7, y = 8, z = 9 }, # comment
    { x = 2, y = 4, z = 8 } ] # comment`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles parse malformed local time as string (#8433)",
  fn() {
    const expected = { sign: "2020-01-01x" };
    const actual = parse(`sign='2020-01-01x'`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles single-line string comment error",
  fn() {
    assertThrows(
      () => {
        parse(`badComment = 'The first newline is
'
`);
      },
      Error,
      `Parse error on line 1, column 34: Single-line string cannot contain EOL`,
    );
  },
});

Deno.test({
  name: "parse() handles invalid string format",
  fn() {
    assertThrows(
      () => {
        parse(`[invalid-string]
foo = BAR
`);
      },
      Error,
      "Parse error on line 2, column 6: Cannot parse value on line 'foo = BAR'",
    );
  },
});

Deno.test({
  name: "parse() handles invalid whitespaces",
  fn() {
    assertThrows(
      () => {
        parse(`　foo = "bar"
`);
      },
      Error,
      "Parse error on line 1, column 0: Cannot parse the TOML: It contains invalid whitespace at position '0': `\\u3000`",
    );
    assertThrows(
      () => {
        parse(`foo　= "bar"
`);
      },
      Error,
      "Parse error on line 1, column 3: Cannot parse the TOML: It contains invalid whitespace at position '3': `\\u3000`",
    );
  },
});

Deno.test({
  name: "parse() handles empty inline table",
  fn() {
    const input = `[package.metadata.details]
readme = { }`;
    const expected = {
      package: { metadata: { details: { readme: {} } } },
    };
    const actual = parse(input);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles NaN and inf",
  fn() {
    assertEquals(parse("value = nan").value, NaN);
    assertEquals(parse("value = +nan").value, NaN);
    assertEquals(parse("value = -nan").value, NaN);
    assertEquals(parse("value = inf").value, Infinity);
    assertEquals(parse("value = +inf").value, Infinity);
    assertEquals(parse("value = -inf").value, -Infinity);
    assertThrows(() => parse("value = NaN").value);
    assertThrows(() => parse("value = +NaN").value);
    assertThrows(() => parse("value = -NaN").value);
    assertThrows(() => parse("value = Inf").value);
    assertThrows(() => parse("value = +Inf").value);
    assertThrows(() => parse("value = -Inf").value);
    assertThrows(() => parse("value = nannan"));
    assertThrows(() => parse("value = -nan_"));
    assertThrows(() => parse("value = infinf"));
    assertThrows(() => parse("value = -inf_"));
  },
});

Deno.test({
  name: "parse() handles nested table arrays",
  fn() {
    const content = `
[[table]]
foo = "foo"
[[table.children]]
bar = "bar"`;

    const expected = { table: [{ foo: "foo", children: [{ bar: "bar" }] }] };
    assertEquals(parse(content), expected);
  },
});

Deno.test({
  name: "parse() doesn't pollute prototype with __proto__",
  async fn() {
    const testCode = `
      import { parse } from "${import.meta.resolve("./parse.ts")}";
      import { assertEquals } from "@std/assert";
      parse('[__proto__.isAdmin]');
      assertEquals({}.isAdmin, undefined, "Prototype pollution detected");
      parse('[[__proto__.arrayTable]]\\npolluted = true');
      assertEquals({}.arrayTable, undefined, "Prototype pollution detected");
      parse('[foo]\\n[foo.__proto__.bar]');
      assertEquals({}.bar, undefined, "Prototype pollution detected");
    `;
    const command = new Deno.Command(Deno.execPath(), {
      stdout: "inherit",
      stderr: "inherit",
      args: ["eval", "--no-lock", "--unstable-unsafe-proto", testCode],
    });
    const { success } = await command.output();
    assert(success);
  },
});
