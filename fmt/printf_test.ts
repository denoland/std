// Copyright 2018-2025 the Deno authors. MIT license.
//
// A number of test-cases based on:
//
//   https://golang.org/src/fmt/fmt_test.go
//   BSD: Copyright (c) 2009 The Go Authors. All rights reserved.

import { printf, sprintf } from "./printf.ts";
import { assertEquals, assertThrows } from "@std/assert";
import { assertSpyCall, spy } from "@std/testing/mock";

Deno.test("sprintf() handles noVerb", function () {
  assertEquals(sprintf("bla"), "bla");
});

Deno.test("sprintf() handles percent", function () {
  assertEquals(sprintf("%%"), "%");
  assertEquals(sprintf("!%%!"), "!%!");
  assertEquals(sprintf("!%%"), "!%");
  assertEquals(sprintf("%%!"), "%!");
});
Deno.test("sprintf() handles boolean", function () {
  assertEquals(sprintf("%t", true), "true");
  assertEquals(sprintf("%10t", true), "      true");
  assertEquals(sprintf("%-10t", false), "false     ");
  assertEquals(sprintf("%t", false), "false");
  assertEquals(sprintf("bla%t", true), "blatrue");
  assertEquals(sprintf("%tbla", false), "falsebla");
});

Deno.test("sprintf() handles integer", function () {
  assertEquals(sprintf("%b", 4), "100");
  assertEquals(sprintf("%b", -4), "-100");
  assertEquals(
    sprintf("%b", 4.1),
    "100.0001100110011001100110011001100110011001100110011",
  );
  assertEquals(
    sprintf("%b", -4.1),
    "-100.0001100110011001100110011001100110011001100110011",
  );
  assertEquals(
    sprintf("%b", Number.MAX_SAFE_INTEGER),
    "11111111111111111111111111111111111111111111111111111",
  );
  assertEquals(
    sprintf("%b", Number.MIN_SAFE_INTEGER),
    "-11111111111111111111111111111111111111111111111111111",
  );
  // width

  assertEquals(sprintf("%4b", 4), " 100");
});

Deno.test("sprintf() handles integerC", function () {
  assertEquals(sprintf("%c", 0x31), "1");
  assertEquals(sprintf("%c%b", 0x31, 1), "11");
  assertEquals(sprintf("%c", 0x1f4a9), "💩");
  //width
  assertEquals(sprintf("%4c", 0x31), "   1");
});

Deno.test("sprintf() handles integerD", function () {
  assertEquals(sprintf("%d", 4), "4");
  assertEquals(sprintf("%d", -4), "-4");
  assertEquals(sprintf("%d", Number.MAX_SAFE_INTEGER), "9007199254740991");
  assertEquals(sprintf("%d", Number.MIN_SAFE_INTEGER), "-9007199254740991");
});

Deno.test("sprintf() handles integerO", function () {
  assertEquals(sprintf("%o", 4), "4");
  assertEquals(sprintf("%o", -4), "-4");
  assertEquals(sprintf("%o", 9), "11");
  assertEquals(sprintf("%o", -9), "-11");
  assertEquals(sprintf("%o", Number.MAX_SAFE_INTEGER), "377777777777777777");
  assertEquals(sprintf("%o", Number.MIN_SAFE_INTEGER), "-377777777777777777");
  // width
  assertEquals(sprintf("%4o", 4), "   4");
});
Deno.test("sprintf() handles integerx", function () {
  assertEquals(sprintf("%x", 4), "4");
  assertEquals(sprintf("%x", -4), "-4");
  assertEquals(sprintf("%x", 9), "9");
  assertEquals(sprintf("%x", -9), "-9");
  assertEquals(sprintf("%x", Number.MAX_SAFE_INTEGER), "1fffffffffffff");
  assertEquals(sprintf("%x", Number.MIN_SAFE_INTEGER), "-1fffffffffffff");
  // width
  assertEquals(sprintf("%4x", -4), "  -4");
  assertEquals(sprintf("%-4x", -4), "-4  ");
  // plus
  assertEquals(sprintf("%+4x", 4), "  +4");
  assertEquals(sprintf("%-+4x", 4), "+4  ");
});
Deno.test("sprintf() handles integerX", function () {
  assertEquals(sprintf("%X", 4), "4");
  assertEquals(sprintf("%X", -4), "-4");
  assertEquals(sprintf("%X", 9), "9");
  assertEquals(sprintf("%X", -9), "-9");
  assertEquals(sprintf("%X", Number.MAX_SAFE_INTEGER), "1FFFFFFFFFFFFF");
  assertEquals(sprintf("%X", Number.MIN_SAFE_INTEGER), "-1FFFFFFFFFFFFF");
});

Deno.test("sprintf() handles floats", function () {
  assertEquals(sprintf("%e", 4), "4.000000e+00");
  assertEquals(sprintf("%e", -4), "-4.000000e+00");
  assertEquals(sprintf("%e", 4.1), "4.100000e+00");
  assertEquals(sprintf("%e", -4.1), "-4.100000e+00");
  assertEquals(sprintf("%e", Number.MAX_SAFE_INTEGER), "9.007199e+15");
  assertEquals(sprintf("%e", Number.MIN_SAFE_INTEGER), "-9.007199e+15");
  assertEquals(sprintf("%.3e", 1.9999), "2.000e+00");
  assertEquals(sprintf("%.3e", 29.99999), "3.000e+01");
  assertEquals(sprintf("%.3e", 999999), "1.000e+06");
  assertEquals(sprintf("%.3e", 0.000099999), "1.000e-04");
});
Deno.test("sprintf() handles floatE", function () {
  assertEquals(sprintf("%E", 4), "4.000000E+00");
  assertEquals(sprintf("%E", -4), "-4.000000E+00");
  assertEquals(sprintf("%E", 4.1), "4.100000E+00");
  assertEquals(sprintf("%E", -4.1), "-4.100000E+00");
  assertEquals(sprintf("%E", Number.MAX_SAFE_INTEGER), "9.007199E+15");
  assertEquals(sprintf("%E", Number.MIN_SAFE_INTEGER), "-9.007199E+15");
  assertEquals(sprintf("%E", Number.MIN_VALUE), "5.000000E-324");
  assertEquals(sprintf("%E", Number.MAX_VALUE), "1.797693E+308");
});
Deno.test("sprintf() handles floatfF", function () {
  assertEquals(sprintf("%f", 4), "4.000000");
  assertEquals(sprintf("%F", 4), "4.000000");
  assertEquals(sprintf("%f", -4), "-4.000000");
  assertEquals(sprintf("%F", -4), "-4.000000");
  assertEquals(sprintf("%f", 4.1), "4.100000");
  assertEquals(sprintf("%F", 4.1), "4.100000");
  assertEquals(sprintf("%f", -4.1), "-4.100000");
  assertEquals(sprintf("%F", -4.1), "-4.100000");
  assertEquals(
    sprintf("%f", Number.MAX_SAFE_INTEGER),
    "9007199254740991.000000",
  );
  assertEquals(
    sprintf("%F", Number.MAX_SAFE_INTEGER),
    "9007199254740991.000000",
  );
  assertEquals(
    sprintf("%f", Number.MIN_SAFE_INTEGER),
    "-9007199254740991.000000",
  );
  assertEquals(
    sprintf("%F", Number.MIN_SAFE_INTEGER),
    "-9007199254740991.000000",
  );
  assertEquals(sprintf("%f", Number.MIN_VALUE), "0.000000");
  assertEquals(
    sprintf("%.324f", Number.MIN_VALUE),
    "0.000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005",
  );
  assertEquals(sprintf("%F", Number.MIN_VALUE), "0.000000");
  assertEquals(
    sprintf("%f", Number.MAX_VALUE),
    "179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000.000000",
  );
  assertEquals(
    sprintf("%F", Number.MAX_VALUE),
    "179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000.000000",
  );
  assertEquals(sprintf("%.3f", 0.9999), "1.000");
  assertEquals(sprintf("%.3f", 1.9999), "2.000");
});

Deno.test("sprintf() handles string", function () {
  assertEquals(sprintf("%s World%s", "Hello", "!"), "Hello World!");
});

Deno.test("sprintf() handles hex", function () {
  assertEquals(sprintf("%x", "123"), "313233");
  assertEquals(sprintf("%x", "n"), "6e");

  // hex throws with non-strings and non-numbers
  assertThrows(
    () => sprintf("%x", {}),
    Error,
    "Cannot format hex, only number and string are supported for hex formatting: object is given",
  );
});
Deno.test("sprintf() handles heX", function () {
  assertEquals(sprintf("%X", "123"), "313233");
  assertEquals(sprintf("%X", "n"), "6E");
});

Deno.test("sprintf() handles type", function () {
  assertEquals(sprintf("%T", new Date()), "object");
  assertEquals(sprintf("%T", 123), "number");
  assertEquals(sprintf("%T", "123"), "string");
  assertEquals(sprintf("%.3T", "123"), "str");
});

Deno.test("sprintf() handles positional", function () {
  assertEquals(sprintf("%[1]d%[2]d", 1, 2), "12");
  assertEquals(sprintf("%[2]d%[1]d", 1, 2), "21");
});

Deno.test("sprintf() handles sharp", function () {
  assertEquals(sprintf("%#x", "123"), "0x313233");
  assertEquals(sprintf("%#X", "123"), "0X313233");
  assertEquals(sprintf("%#x", 123), "0x7b");
  assertEquals(sprintf("%#X", 123), "0X7B");
  assertEquals(sprintf("%#o", 123), "0173");
  assertEquals(sprintf("%#b", 4), "0b100");
});

Deno.test("sprintf() handles width and precision", function () {
  assertEquals(
    sprintf("%9.99d", 9),
    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009",
  );
  assertEquals(sprintf("%1.12d", 9), "000000000009");
  assertEquals(sprintf("%2s", "a"), " a");
  assertEquals(sprintf("%2d", 1), " 1");
  assertEquals(sprintf("%#4x", 1), " 0x1");

  assertEquals(
    sprintf("%*.99d", 9, 9),
    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009",
  );
  assertEquals(
    sprintf("%9.*d", 99, 9),
    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009",
  );
  assertEquals(sprintf("%*s", 2, "a"), " a");
  assertEquals(sprintf("%*d", 2, 1), " 1");
  assertEquals(sprintf("%#*x", 4, 1), " 0x1");
});

Deno.test("sprintf() handles dash", function () {
  assertEquals(sprintf("%-2s", "a"), "a ");
  assertEquals(sprintf("%-2d", 1), "1 ");
});
Deno.test("sprintf() handles plus", function () {
  assertEquals(sprintf("%-+3d", 1), "+1 ");
  assertEquals(sprintf("%+3d", 1), " +1");
  assertEquals(sprintf("%+3d", -1), " -1");
});

Deno.test("sprintf() handles space", function () {
  assertEquals(sprintf("% -3d", 3), " 3 ");
});

Deno.test("sprintf() handles zero", function () {
  assertEquals(sprintf("%04s", "a"), "000a");
});

// relevant test cases from fmt_test.go
// deno-lint-ignore no-explicit-any
const tests: Array<[string, any, string]> = [
  ["%d", 12345, "12345"],
  ["%v", 12345, "12345"],
  ["%t", true, "true"],
  // basic string
  ["%s", "abc", "abc"],
  // ["%q", "abc", `"abc"`], // TODO: need %q?
  ["%x", "abc", "616263"],
  ["%x", "\xff\xf0\x0f\xff", "fff00fff"],
  ["%X", "\xff\xf0\x0f\xff", "FFF00FFF"],
  ["%x", "", ""],
  ["% x", "", ""],
  ["%#x", "", ""],
  ["%# x", "", ""],
  ["%x", "xyz", "78797a"],
  ["%X", "xyz", "78797A"],
  ["% x", "xyz", "78 79 7a"],
  ["% X", "xyz", "78 79 7A"],
  ["%#x", "xyz", "0x78797a"],
  ["%#X", "xyz", "0X78797A"],
  ["%# x", "xyz", "0x78 0x79 0x7a"],
  ["%# X", "xyz", "0X78 0X79 0X7A"],
  // basic bytes : TODO special handling for Buffer? other std types?
  // escaped strings : TODO decide whether to have %q

  // characters
  ["%c", "x".charCodeAt(0), "x"],
  ["%c", 0xe4, "ä"],
  ["%c", 0x672c, "本"],
  ["%c", "日".charCodeAt(0), "日"],
  // Specifying precision should have no effect.
  ["%.0c", "⌘".charCodeAt(0), "⌘"],
  ["%3c", "⌘".charCodeAt(0), "  ⌘"],
  ["%-3c", "⌘".charCodeAt(0), "⌘  "],
  // Runes that are not printable.
  // {"%c", '\U00000e00', "\u0e00"},
  // TODO(bartlomieju) check if \U escape exists in js
  //["%c", '\U0010ffff'.codePointAt(0), "\U0010ffff"],

  // Runes that are not valid.
  ["%c", -1, "�"],
  // TODO(bartomieju): surrogate half, doesn't make sense in itself, how
  // to determine in JS?
  // ["%c", 0xDC80, "�"],
  ["%c", 0x110000, "�"],
  ["%c", 0xfffffffff, "�"],
  // TODO(bartlomieju):
  // escaped characters
  // Runes that are not printable.
  // Runes that are not valid.

  // width
  ["%5s", "abc", "  abc"],
  ["%2s", "\u263a", " ☺"],
  ["%-5s", "abc", "abc  "],
  ["%05s", "abc", "00abc"],
  ["%5s", "abcdefghijklmnopqrstuvwxyz", "abcdefghijklmnopqrstuvwxyz"],
  ["%.5s", "abcdefghijklmnopqrstuvwxyz", "abcde"],
  ["%.0s", "日本語日本語", ""],
  ["%.5s", "日本語日本語", "日本語日本"],
  ["%.10s", "日本語日本語", "日本語日本語"],
  // ["%08q", "abc", `000"abc"`],
  // TODO(bartlomieju): verb q
  // ["%-8q", "abc", `"abc"   `],
  //["%.5q", "abcdefghijklmnopqrstuvwxyz", `"abcde"`],
  ["%.5x", "abcdefghijklmnopqrstuvwxyz", "6162636465"],
  //["%.3q", "日本語日本語", `"日本語"`],
  //["%.1q", "日本語", `"日"`]
  // change of go testcase utf-8([日]) = 0xe697a5, utf-16= 65e5 and
  // our %x takes lower byte of string "%.1x", "日本語", "e6"],,
  ["%.1x", "日本語", "e5"],
  //["%10.1q", "日本語日本語", `       "日"`],
  // ["%10v", null, "     <nil>"],
  // TODO(bartlomieju): null, undefined ...
  // ["%-10v", null, "<nil>     "],

  // integers
  ["%d", 12345, "12345"],
  ["%d", -12345, "-12345"],
  // ["%d", ^uint8(0), "255"],
  //["%d", ^uint16(0), "65535"],
  //["%d", ^uint32(0), "4294967295"],
  //["%d", ^uint64(0), "18446744073709551615"],
  ["%d", -1 << 7, "-128"],
  ["%d", -1 << 15, "-32768"],
  ["%d", -1 << 31, "-2147483648"],
  //["%d", (-1 << 63), "-9223372036854775808"],
  ["%.d", 0, ""],
  ["%.0d", 0, ""],
  ["%6.0d", 0, "      "],
  ["%06.0d", 0, "      "], // 0 flag should be ignored
  ["% d", 12345, " 12345"],
  ["%+d", 12345, "+12345"],
  ["%+d", -12345, "-12345"],
  ["%b", 7, "111"],
  ["%b", -6, "-110"],
  // ["%b", ^uint32(0), "11111111111111111111111111111111"],
  // ["%b", ^uint64(0),
  //  "1111111111111111111111111111111111111111111111111111111111111111"],
  // ["%b", int64(-1 << 63), zeroFill("-1", 63, "")],
  // 0 octal notation not allowed in struct node...
  ["%o", parseInt("01234", 8), "1234"],
  ["%#o", parseInt("01234", 8), "01234"],
  // ["%o", ^uint32(0), "37777777777"],
  // ["%o", ^uint64(0), "1777777777777777777777"],
  ["%#X", 0, "0X0"],
  ["%x", 0x12abcdef, "12abcdef"],
  ["%X", 0x12abcdef, "12ABCDEF"],
  // ["%x", ^uint32(0), "ffffffff"],
  // ["%X", ^uint64(0), "FFFFFFFFFFFFFFFF"],
  ["%.20b", 7, "00000000000000000111"],
  ["%10d", 12345, "     12345"],
  ["%10d", -12345, "    -12345"],
  ["%+10d", 12345, "    +12345"],
  ["%010d", 12345, "0000012345"],
  ["%010d", -12345, "-000012345"],
  ["%20.8d", 1234, "            00001234"],
  ["%20.8d", -1234, "           -00001234"],
  ["%020.8d", 1234, "            00001234"],
  ["%020.8d", -1234, "           -00001234"],
  ["%-20.8d", 1234, "00001234            "],
  ["%-20.8d", -1234, "-00001234           "],
  ["%-#20.8x", 0x1234abc, "0x01234abc          "],
  ["%-#20.8X", 0x1234abc, "0X01234ABC          "],
  ["%-#20.8o", parseInt("01234", 8), "00001234            "],
  // Test correct f.intbuf overflow checks.
  // TODO(bartlomieju): lazy
  // unicode format
  // TODO(bartlomieju): decide whether unicode verb makes sense %U

  // floats
  ["%+.3e", 0.0, "+0.000e+00"],
  ["%+.3e", 1.0, "+1.000e+00"],
  ["%+.3f", -1.0, "-1.000"],
  ["%+.3F", -1.0, "-1.000"],
  //["%+.3F", float32(-1.0), "-1.000"],
  ["%+07.2f", 1.0, "+001.00"],
  ["%+07.2f", -1.0, "-001.00"],
  ["%-07.2f", 1.0, "1.00   "],
  ["%-07.2f", -1.0, "-1.00  "],
  ["%+-07.2f", 1.0, "+1.00  "],
  ["%+-07.2f", -1.0, "-1.00  "],
  ["%-+07.2f", 1.0, "+1.00  "],
  ["%-+07.2f", -1.0, "-1.00  "],
  ["%+10.2f", +1.0, "     +1.00"],
  ["%+10.2f", -1.0, "     -1.00"],
  ["% .3E", -1.0, "-1.000E+00"],
  ["% .3e", 1.0, " 1.000e+00"],
  ["%+.3g", 0.0, "+0"],
  ["%+.3g", 1.0, "+1"],
  ["%+.3g", -1.0, "-1"],
  ["% .3g", -1.0, "-1"],
  ["% .3g", 1.0, " 1"],
  //	//["%b", float32(1.0), "8388608p-23"],
  //	["%b", 1.0, "4503599627370496p-52"],
  //	// Test sharp flag used with floats.
  ["%#g", 1e-323, "1.00000e-323"],
  ["%#g", -1.0, "-1.00000"],
  ["%#g", 1.1, "1.10000"],
  ["%#g", 123456.0, "123456."],
  //["%#g", 1234567.0, "1.234567e+06"],
  // the line above is incorrect in go (according to
  // my posix reading) %f-> prec = prec-1
  ["%#g", 1234567.0, "1.23457e+06"],
  ["%#g", 1230000.0, "1.23000e+06"],
  ["%#g", 1000000.0, "1.00000e+06"],
  ["%#.0f", 1.0, "1."],
  ["%#.0e", 1.0, "1.e+00"],
  ["%#.0g", 1.0, "1."],
  ["%#.0g", 1100000.0, "1.e+06"],
  ["%#.4f", 1.0, "1.0000"],
  ["%#.4e", 1.0, "1.0000e+00"],
  ["%#.4g", 1.0, "1.000"],
  ["%#.4g", 100000.0, "1.000e+05"],
  ["%#.0f", 123.0, "123."],
  ["%#.0e", 123.0, "1.e+02"],
  ["%#.0g", 123.0, "1.e+02"],
  ["%#.4f", 123.0, "123.0000"],
  ["%#.4e", 123.0, "1.2300e+02"],
  ["%#.4g", 123.0, "123.0"],
  ["%#.4g", 123000.0, "1.230e+05"],
  ["%#9.4g", 1.0, "    1.000"],
  // The sharp flag has no effect for binary float format.
  //	["%#b", 1.0, "4503599627370496p-52"], // TODO binary for floats
  // Precision has no effect for binary float format.
  //["%.4b", float32(1.0), "8388608p-23"], // TODO s.above
  // ["%.4b", -1.0, "-4503599627370496p-52"],
  // Test correct f.intbuf boundary checks.
  //["%.68f", 1.0, zeroFill("1.", 68, "")], // TODO zerofill
  //["%.68f", -1.0, zeroFill("-1.", 68, "")], //TODO s.a.
  // float infinites and NaNs
  ["%f", Number.POSITIVE_INFINITY, "+Inf"],
  ["%.1f", Number.NEGATIVE_INFINITY, "-Inf"],
  ["% f", NaN, " NaN"],
  ["%20f", Number.POSITIVE_INFINITY, "                +Inf"],
  // ["% 20F", Number.POSITIVE_INFINITY, "                 Inf"], // TODO : wut?
  ["% 20e", Number.NEGATIVE_INFINITY, "                -Inf"],
  ["%+20E", Number.NEGATIVE_INFINITY, "                -Inf"],
  ["% +20g", Number.NEGATIVE_INFINITY, "                -Inf"],
  ["%+-20G", Number.POSITIVE_INFINITY, "+Inf                "],
  ["%20e", NaN, "                 NaN"],
  ["% +20E", NaN, "                +NaN"],
  ["% -20g", NaN, " NaN                "],
  ["%+-20G", NaN, "+NaN                "],
  // Zero padding does not apply to infinities and NaN.
  ["%+020e", Number.POSITIVE_INFINITY, "                +Inf"],
  ["%-020f", Number.NEGATIVE_INFINITY, "-Inf                "],
  ["%-020E", NaN, "NaN                 "],
  // complex values // go specific
  // old test/fmt_test.go
  ["%e", 1.0, "1.000000e+00"],
  ["%e", 1234.5678e3, "1.234568e+06"],
  ["%e", 1234.5678e-8, "1.234568e-05"],
  ["%e", -7.0, "-7.000000e+00"],
  ["%e", -1e-9, "-1.000000e-09"],
  ["%f", 1234.5678e3, "1234567.800000"],
  ["%f", 1234.5678e-8, "0.000012"],
  ["%f", -7.0, "-7.000000"],
  ["%f", -1e-9, "-0.000000"],
  // ["%g", 1234.5678e3, "1.2345678e+06"],
  // I believe the above test from go is incorrect according to posix, s. above.
  ["%g", 1234.5678e3, "1.23457e+06"],
  //["%g", float32(1234.5678e3), "1.2345678e+06"],
  //["%g", 1234.5678e-8, "1.2345678e-05"], // posix, see above
  ["%g", 1234.5678e-8, "1.23457e-05"],
  ["%g", -7.0, "-7"],
  ["%g", -1e-9, "-1e-09"],
  //["%g", float32(-1e-9), "-1e-09"],
  ["%E", 1.0, "1.000000E+00"],
  ["%E", 1234.5678e3, "1.234568E+06"],
  ["%E", 1234.5678e-8, "1.234568E-05"],
  ["%E", -7.0, "-7.000000E+00"],
  ["%E", -1e-9, "-1.000000E-09"],
  //["%G", 1234.5678e3, "1.2345678E+06"], // posix, see above
  ["%G", 1234.5678e3, "1.23457E+06"],
  //["%G", float32(1234.5678e3), "1.2345678E+06"],
  //["%G", 1234.5678e-8, "1.2345678E-05"], // posic, see above
  ["%G", 1234.5678e-8, "1.23457E-05"],
  ["%G", -7.0, "-7"],
  ["%G", -1e-9, "-1E-09"],
  //["%G", float32(-1e-9), "-1E-09"],
  ["%20.5s", "qwertyuiop", "               qwert"],
  ["%.5s", "qwertyuiop", "qwert"],
  ["%-20.5s", "qwertyuiop", "qwert               "],
  ["%20c", "x".charCodeAt(0), "                   x"],
  ["%-20c", "x".charCodeAt(0), "x                   "],
  ["%20.6e", 1.2345e3, "        1.234500e+03"],
  ["%20.6e", 1.2345e-3, "        1.234500e-03"],
  ["%20e", 1.2345e3, "        1.234500e+03"],
  ["%20e", 1.2345e-3, "        1.234500e-03"],
  ["%20.8e", 1.2345e3, "      1.23450000e+03"],
  ["%20f", 1.23456789e3, "         1234.567890"],
  ["%20f", 1.23456789e-3, "            0.001235"],
  ["%20f", 12345678901.23456789, "  12345678901.234568"],
  ["%-20f", 1.23456789e3, "1234.567890         "],
  ["%20.8f", 1.23456789e3, "       1234.56789000"],
  ["%20.8f", 1.23456789e-3, "          0.00123457"],
  // ["%g", 1.23456789e3, "1234.56789"],
  // posix ... precision(2) = precision(def=6) - (exp(3)+1)
  ["%g", 1.23456789e3, "1234.57"],
  // ["%g", 1.23456789e-3, "0.00123456789"], posix...
  ["%g", 1.23456789e-3, "0.00123457"], // see above prec6 = precdef6 - (-3+1)
  //["%g", 1.23456789e20, "1.23456789e+20"],
  ["%g", 1.23456789e20, "1.23457e+20"],
  // arrays
  // TODO(bartlomieju):
  // slice : go specific

  // TODO(bartlomieju): decide how to handle deeper types, arrays, objects
  // byte arrays and slices with %b,%c,%d,%o,%U and %v
  // f.space should and f.plus should not have an effect with %v.
  // f.space and f.plus should have an effect with %d.

  // Padding with byte slices.
  // Same for strings
  ["%2x", "", "  "], // 103
  ["%#2x", "", "  "],
  ["% 02x", "", "00"],
  ["%# 02x", "", "00"],
  ["%-2x", "", "  "],
  ["%-02x", "", "  "],
  ["%8x", "\xab", "      ab"],
  ["% 8x", "\xab", "      ab"],
  ["%#8x", "\xab", "    0xab"],
  ["%# 8x", "\xab", "    0xab"],
  ["%08x", "\xab", "000000ab"],
  ["% 08x", "\xab", "000000ab"],
  ["%#08x", "\xab", "00000xab"],
  ["%# 08x", "\xab", "00000xab"],
  ["%10x", "\xab\xcd", "      abcd"],
  ["% 10x", "\xab\xcd", "     ab cd"],
  ["%#10x", "\xab\xcd", "    0xabcd"],
  ["%# 10x", "\xab\xcd", " 0xab 0xcd"],
  ["%010x", "\xab\xcd", "000000abcd"],
  ["% 010x", "\xab\xcd", "00000ab cd"],
  ["%#010x", "\xab\xcd", "00000xabcd"],
  ["%# 010x", "\xab\xcd", "00xab 0xcd"],
  ["%-10X", "\xab", "AB        "],
  ["% -010X", "\xab", "AB        "],
  ["%#-10X", "\xab\xcd", "0XABCD    "],
  ["%# -010X", "\xab\xcd", "0XAB 0XCD "],
  // renamings
  // Formatter
  // GoStringer

  // %T TODO possibly %#T object(constructor)
  ["%T", {}, "object"],
  ["%T", 1, "number"],
  ["%T", "", "string"],
  ["%T", undefined, "undefined"],
  ["%T", null, "object"],
  ["%T", sprintf, "function"],
  ["%T", true, "boolean"],
  ["%T", Symbol(), "symbol"],
  // %p with pointers

  // erroneous things
  //	{"", nil, "%!(EXTRA <nil>)"},
  //	{"", 2, "%!(EXTRA int=2)"},
  //	{"no args", "hello", "no args%!(EXTRA string=hello)"},
  //	{"%s %", "hello", "hello %!(NOVERB)"},
  //	{"%s %.2", "hello", "hello %!(NOVERB)"},
  //	{"%017091901790959340919092959340919017929593813360", 0,
  //       "%!(NOVERB)%!(EXTRA int=0)"},
  //	{"%184467440737095516170v", 0, "%!(NOVERB)%!(EXTRA int=0)"},
  //	// Extra argument errors should format without flags set.
  //	{"%010.2", "12345", "%!(NOVERB)%!(EXTRA string=12345)"},
  //
  //	// Test that maps with non-reflexive keys print all keys and values.
  //	{"%v", map[float64]int{NaN: 1, NaN: 1}, "map[NaN:1 NaN:1]"},

  // more floats

  ["%.2f", 1.0, "1.00"],
  ["%.2f", -1.0, "-1.00"],
  ["% .2f", 1.0, " 1.00"],
  ["% .2f", -1.0, "-1.00"],
  ["%+.2f", 1.0, "+1.00"],
  ["%+.2f", -1.0, "-1.00"],
  ["%7.2f", 1.0, "   1.00"],
  ["%7.2f", -1.0, "  -1.00"],
  ["% 7.2f", 1.0, "   1.00"],
  ["% 7.2f", -1.0, "  -1.00"],
  ["%+7.2f", 1.0, "  +1.00"],
  ["%+7.2f", -1.0, "  -1.00"],
  ["% +7.2f", 1.0, "  +1.00"],
  ["% +7.2f", -1.0, "  -1.00"],
  ["%07.2f", 1.0, "0001.00"],
  ["%07.2f", -1.0, "-001.00"],
  ["% 07.2f", 1.0, " 001.00"], //153 here
  ["% 07.2f", -1.0, "-001.00"],
  ["%+07.2f", 1.0, "+001.00"],
  ["%+07.2f", -1.0, "-001.00"],
  ["% +07.2f", 1.0, "+001.00"],
  ["% +07.2f", -1.0, "-001.00"],
];

Deno.test("sprintf() handles thorough", function () {
  tests.forEach((t, i) => {
    //            p(t)
    const is = sprintf(t[0], t[1]);
    const should = t[2];
    assertEquals(
      is,
      should,
      `failed case[${i}] : is >${is}< should >${should}<`,
    );
  });
});

Deno.test("sprintf() handles weirdos", function () {
  assertEquals(sprintf("%.d", 9), "9");
  assertEquals(
    sprintf("dec[%d]=%d hex[%[1]d]=%#x oct[%[1]d]=%#o %s", 1, 255, "Third"),
    "dec[1]=255 hex[1]=0xff oct[1]=0377 Third",
  );
});

Deno.test("sprintf() handles formatV", function () {
  const a = { a: { a: { a: { a: { a: { a: { a: {} } } } } } } };
  assertEquals(sprintf("%v", a), "[object Object]");
  assertEquals(
    sprintf("%#v", a),
    `{
  a: {
    a: { a: { a: { a: [Object] } } }
  }
}`,
  );
  assertEquals(
    sprintf("%#.8v", a),
    `{
  a: {
    a: {
      a: {
        a: { a: { a: { a: {} } } }
      }
    }
  }
}`,
  );
  assertEquals(sprintf("%#.1v", a), `{ a: { a: [Object] } }`);
  assertEquals(sprintf("%.10v", a), "[object Ob"); // truncated at 10th char
});

Deno.test("sprintf() handles formatJ", function () {
  const a = { a: { a: { a: { a: { a: { a: { a: {} } } } } } } };
  assertEquals(
    sprintf("%j", a),
    `{"a":{"a":{"a":{"a":{"a":{"a":{"a":{}}}}}}}}`,
  );
});

Deno.test("sprintf() handles formatI", function () {
  const a = { a: { a: { a: { a: { a: { a: { a: {} } } } } } } };
  assertEquals(
    sprintf("%i", a),
    "{\n  a: {\n    a: {\n      a: {\n        a: {\n          a: {\n            a: {\n              a: {}\n            }\n          }\n        }\n      }\n    }\n  }\n}",
  );
  assertEquals(
    sprintf("%I", a),
    "{ a: { a: { a: { a: { a: { a: { a: {} } } } } } } }",
  );
});

Deno.test("sprintf() handles lessThan flag", function () {
  const a = { a: { a: { a: { a: { a: { a: { a: {} } } } } } } };
  const aArray = [a, a, a];
  assertEquals(
    sprintf("%<#.1v", aArray),
    `[ { a: { a: [Object] } }, { a: { a: [Object] } }, { a: { a: [Object] } } ]`,
  );
  const fArray = [1.2345, 0.98765, 123456789.5678];
  assertEquals(sprintf("%<.2f", fArray), "[ 1.23, 0.99, 123456789.57 ]");
});

Deno.test("sprintf() handles errors", function () {
  // wrong type : TODO strict mode ...
  //assertEquals(S("%f", "not a number"), "%!(BADTYPE flag=f type=string)")
  assertEquals(sprintf("A %h", ""), "A %!(BAD VERB 'h')");
  assertEquals(sprintf("%J", ""), "%!(BAD VERB 'J')");
  assertEquals(sprintf("bla%J", ""), "bla%!(BAD VERB 'J')");
  assertEquals(sprintf("%Jbla", ""), "%!(BAD VERB 'J')bla");

  assertEquals(sprintf("%d"), "%!(MISSING 'd')");
  assertEquals(sprintf("%d %d", 1), "1 %!(MISSING 'd')");
  assertEquals(sprintf("%d %f A", 1), "1 %!(MISSING 'f') A");

  assertEquals(sprintf("%*.2f", "a", 1.1), "%!(BAD WIDTH 'a')");
  assertEquals(sprintf("%.*f", "a", 1.1), "%!(BAD PREC 'a')");
  assertEquals(
    sprintf("%.[2]*f", 1.23, "p"),
    `%!(BAD PREC 'p')%!(EXTRA '1.23')`,
  );
  assertEquals(
    sprintf("%.[2]*[1]f Yippie!", 1.23, "p"),
    "%!(BAD PREC 'p') Yippie!",
  );

  assertEquals(sprintf("%[1]*.2f", "a", "p"), "%!(BAD WIDTH 'a')");

  assertEquals(sprintf("A", "a", "p"), `A%!(EXTRA '"a"' '"p"')`);
  assertEquals(sprintf("%[2]s %[2]s", "a", "p"), `p p%!(EXTRA '"a"')`);

  // remains to be determined how to handle bad indices ...
  // (realistically) the entire error handling is still up for grabs.
  assertEquals(
    sprintf("%[hallo]s %d %d %d", 1, 2, 3, 4),
    "%!(BAD INDEX) 2 3 4",
  );
  assertEquals(
    sprintf("%[5]s", 1, 2, 3, 4),
    `%!(BAD INDEX)%!(EXTRA '2' '3' '4')`,
  );
  assertEquals(sprintf("%[5]f"), "%!(BAD INDEX)");
  assertEquals(sprintf("%.[5]f"), "%!(BAD INDEX)");
  assertEquals(sprintf("%.[5]*f"), "%!(BAD INDEX)");
});

Deno.test("sprintf() throws with d with sharp option", () => {
  assertThrows(
    () => sprintf("%#d", 1.1),
    Error,
    "Cannot handle the radix 10: only 2, 8, 16 are supported",
  );
});

Deno.test("printf() prints the result synchronously", () => {
  using writeSpy = spy(Deno.stdout, "writeSync");
  printf("Hello %s", "world");

  assertSpyCall(writeSpy, 0, {
    args: [new TextEncoder().encode("Hello world")],
  });
});
