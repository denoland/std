// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import {
  type Ascii85Standard,
  decodeAscii85,
  encodeAscii85,
} from "./ascii85.ts";
type TestCases = Partial<{ [index in Ascii85Standard]: string[][] }>;
const utf8encoder = new TextEncoder();
const testCasesNoDelimiter: TestCases = {
  Adobe: [
    ["test", "FCfN8"],
    ["ascii85", "@<5pmBfIs"],
    ["Hello world!", "87cURD]j7BEbo80"],
    //wikipedia example
    [
      "Man is distinguished, not only by his reason, but by this singular passion from other animals, which is a lust of the mind, that by a perseverance of delight in the continued and indefatigable generation of knowledge, exceeds the short vehemence of any carnal pleasure.",
      "9jqo^BlbD-BleB1DJ+*+F(f,q/0JhKF<GL>Cj@.4Gp$d7F!,L7@<6@)/0JDEF<G%<+EV:2F!,O<DJ+*.@<*K0@<6L(Df-\\0Ec5e;DffZ(EZee.Bl.9pF\"AGXBPCsi+DGm>@3BB/F*&OCAfu2/AKYi(DIb:@FD,*)+C]U=@3BN#EcYf8ATD3s@q?d$AftVqCh[NqF<G:8+EV:.+Cf>-FD5W8ARlolDIal(DId<j@<?3r@:F%a+D58'ATD4$Bl@l3De:,-DJs`8ARoFb/0JMK@qB4^F!,R<AKZ&-DfTqBG%G>uD.RTpAKYo'+CT/5+Cei#DII?(E,9)oF*2M7/c",
    ],
    ["", ""],
    ["\0", "!!"],
    ["\0\0", "!!!"],
    ["\0\0\0", "!!!!"],
    //special Adobe and btoa test cases - 4 bytes equal to 0 should become a "z"
    ["\0\0\0\0", "z"],
    ["\0\0\0\0\0", "z!!"],
    ["    ", "+<VdL"],
  ],
  btoa: [
    ["test", "FCfN8"],
    ["ascii85", "@<5pmBfIs"],
    ["Hello world!", "87cURD]j7BEbo80"],
    //wikipedia example
    [
      "Man is distinguished, not only by his reason, but by this singular passion from other animals, which is a lust of the mind, that by a perseverance of delight in the continued and indefatigable generation of knowledge, exceeds the short vehemence of any carnal pleasure.",
      "9jqo^BlbD-BleB1DJ+*+F(f,q/0JhKF<GL>Cj@.4Gp$d7F!,L7@<6@)/0JDEF<G%<+EV:2F!,O<DJ+*.@<*K0@<6L(Df-\\0Ec5e;DffZ(EZee.Bl.9pF\"AGXBPCsi+DGm>@3BB/F*&OCAfu2/AKYi(DIb:@FD,*)+C]U=@3BN#EcYf8ATD3s@q?d$AftVqCh[NqF<G:8+EV:.+Cf>-FD5W8ARlolDIal(DId<j@<?3r@:F%a+D58'ATD4$Bl@l3De:,-DJs`8ARoFb/0JMK@qB4^F!,R<AKZ&-DfTqBG%G>uD.RTpAKYo'+CT/5+Cei#DII?(E,9)oF*2M7/c",
    ],
    ["", ""],
    ["\0", "!!"],
    ["\0\0", "!!!"],
    ["\0\0\0", "!!!!"],
    //special Adobe and btoa test cases - 4 bytes equal to 0 should become a "z"
    ["\0\0\0\0", "z"],
    ["\0\0\0\0\0", "z!!"],
    //special btoa test case - 4 spaces should become "y"
    ["    ", "y"],
  ],
  "RFC 1924": [
    ["test", "bY*jN"],
    ["ascii85", "VRK_?X*e|"],
    ["Hello world!", "NM&qnZy<MXa%^NF"],
    //wikipedia example
    [
      "Man is distinguished, not only by his reason, but by this singular passion from other animals, which is a lust of the mind, that by a perseverance of delight in the continued and indefatigable generation of knowledge, exceeds the short vehemence of any carnal pleasure.",
      "O<`^zX>%ZCX>)XGZfA9Ab7*B`EFf-gbRchTY<VDJc_3(Mb0BhMVRLV8EFfZabRc4RAarPHb0BkRZfA9DVR9gFVRLh7Z*CxFa&K)QZ**v7av))DX>DO_b1WctXlY|;AZc?TVIXXEb95kYW*~HEWgu;7Ze%PVbZB98AYyqSVIXj2a&u*NWpZI|V`U(3W*}r`Y-wj`bRcPNAarPDAY*TCbZKsNWn>^>Ze$>7Ze(R<VRUI{VPb4$AZKN6WpZJ3X>V>IZ)PBCZf|#NWn^b%EFfigV`XJzb0BnRWgv5CZ*p`Xc4cT~ZDnp_Wgu^6AYpEKAY);2ZeeU7aBO8^b9HiME&",
    ],
    ["", ""],
    ["\0", "00"],
    ["\0\0", "000"],
    ["\0\0\0", "0000"],
    ["\0\0\0\0", "00000"],
    ["\0\0\0\0\0", "0000000"],
    ["    ", "ARr(h"],
  ],
  Z85: [
    ["test", "By/Jn"],
    ["ascii85", "vrk{)x/E%"],
    ["Hello world!", "nm=QNzY<mxA+]nf"],
    //wikipedia example
    [
      "Man is distinguished, not only by his reason, but by this singular passion from other animals, which is a lust of the mind, that by a perseverance of delight in the continued and indefatigable generation of knowledge, exceeds the short vehemence of any carnal pleasure.",
      "o<}]Zx(+zcx(!xgzFa9aB7/b}efF?GBrCHty<vdjC{3^mB0bHmvrlv8efFzABrC4raARphB0bKrzFa9dvr9GfvrlH7z/cXfA=k!qz//V7AV!!dx(do{B1wCTxLy%&azC)tvixxeB95Kyw/#hewGU&7zE+pvBzb98ayYQsvixJ2A=U/nwPzi%v}u^3w/$R}y?WJ}BrCpnaARpday/tcBzkSnwN(](zE:(7zE^r<vrui@vpB4:azkn6wPzj3x(v(iz!pbczF%-nwN]B+efFIGv}xjZB0bNrwGV5cz/P}xC4Ct#zdNP{wGU]6ayPekay!&2zEEu7Abo8]B9hIme=",
    ],
    ["", ""],
    ["\0", "00"],
    ["\0\0", "000"],
    ["\0\0\0", "0000"],
    ["\0\0\0\0", "00000"],
    ["\0\0\0\0\0", "0000000"],
    ["    ", "arR^H"],
  ],
};
const testCasesDelimiter: TestCases = {
  Adobe: [
    ["test", "<~FCfN8~>"],
    ["ascii85", "<~@<5pmBfIs~>"],
    ["Hello world!", "<~87cURD]j7BEbo80~>"],
    //wikipedia example
    [
      "Man is distinguished, not only by his reason, but by this singular passion from other animals, which is a lust of the mind, that by a perseverance of delight in the continued and indefatigable generation of knowledge, exceeds the short vehemence of any carnal pleasure.",
      "<~9jqo^BlbD-BleB1DJ+*+F(f,q/0JhKF<GL>Cj@.4Gp$d7F!,L7@<6@)/0JDEF<G%<+EV:2F!,O<DJ+*.@<*K0@<6L(Df-\\0Ec5e;DffZ(EZee.Bl.9pF\"AGXBPCsi+DGm>@3BB/F*&OCAfu2/AKYi(DIb:@FD,*)+C]U=@3BN#EcYf8ATD3s@q?d$AftVqCh[NqF<G:8+EV:.+Cf>-FD5W8ARlolDIal(DId<j@<?3r@:F%a+D58'ATD4$Bl@l3De:,-DJs`8ARoFb/0JMK@qB4^F!,R<AKZ&-DfTqBG%G>uD.RTpAKYo'+CT/5+Cei#DII?(E,9)oF*2M7/c~>",
    ],
    ["", "<~~>"],
    ["\0", "<~!!~>"],
    ["\0\0", "<~!!!~>"],
    ["\0\0\0", "<~!!!!~>"],
    //special Adobe and btoa test cases - 4 bytes equal to 0 should become a "z"
    ["\0\0\0\0", "<~z~>"],
    ["\0\0\0\0\0", "<~z!!~>"],
    ["    ", "<~+<VdL~>"],
  ],
  btoa: [
    ["test", "xbtoa Begin\nFCfN8\nxbtoa End"],
    ["ascii85", "xbtoa Begin\n@<5pmBfIs\nxbtoa End"],
    ["Hello world!", "xbtoa Begin\n87cURD]j7BEbo80\nxbtoa End"],
    //wikipedia example
    [
      "Man is distinguished, not only by his reason, but by this singular passion from other animals, which is a lust of the mind, that by a perseverance of delight in the continued and indefatigable generation of knowledge, exceeds the short vehemence of any carnal pleasure.",
      "xbtoa Begin\n9jqo^BlbD-BleB1DJ+*+F(f,q/0JhKF<GL>Cj@.4Gp$d7F!,L7@<6@)/0JDEF<G%<+EV:2F!,O<DJ+*.@<*K0@<6L(Df-\\0Ec5e;DffZ(EZee.Bl.9pF\"AGXBPCsi+DGm>@3BB/F*&OCAfu2/AKYi(DIb:@FD,*)+C]U=@3BN#EcYf8ATD3s@q?d$AftVqCh[NqF<G:8+EV:.+Cf>-FD5W8ARlolDIal(DId<j@<?3r@:F%a+D58'ATD4$Bl@l3De:,-DJs`8ARoFb/0JMK@qB4^F!,R<AKZ&-DfTqBG%G>uD.RTpAKYo'+CT/5+Cei#DII?(E,9)oF*2M7/c\nxbtoa End",
    ],
    ["", "xbtoa Begin\n\nxbtoa End"],
    ["\0", "xbtoa Begin\n!!\nxbtoa End"],
    ["\0\0", "xbtoa Begin\n!!!\nxbtoa End"],
    ["\0\0\0", "xbtoa Begin\n!!!!\nxbtoa End"],
    //special Adobe and btoa test cases - 4 bytes equal to 0 should become a "z"
    ["\0\0\0\0", "xbtoa Begin\nz\nxbtoa End"],
    ["\0\0\0\0\0", "xbtoa Begin\nz!!\nxbtoa End"],
    //special btoa test case - 4 spaces should become "y"
    ["    ", "xbtoa Begin\ny\nxbtoa End"],
  ],
};

for (const [standard, tests] of Object.entries(testCasesNoDelimiter)) {
  if (tests === undefined) continue;
  Deno.test({
    name: `encodeAscii85() encode ${standard}`,
    fn() {
      for (const [bin, b85] of tests) {
        assertEquals(
          encodeAscii85(bin as string, {
            standard: standard as Ascii85Standard,
          }),
          b85,
        );
      }
    },
  });

  Deno.test({
    name: `decodeAscii85() decode ${standard}`,
    fn() {
      for (const [bin, b85] of tests) {
        assertEquals(
          decodeAscii85(b85 as string, {
            standard: standard as Ascii85Standard,
          }),
          utf8encoder.encode(bin),
        );
      }
    },
  });
}
for (const [standard, tests] of Object.entries(testCasesDelimiter)) {
  if (tests === undefined) continue;
  Deno.test({
    name: `encodeAscii85() encodes ${standard} with delimiter`,
    fn() {
      for (const [bin, b85] of tests) {
        assertEquals(
          encodeAscii85(bin as string, {
            standard: standard as Ascii85Standard,
            delimiter: true,
          }),
          b85,
        );
      }
    },
  });

  Deno.test({
    name: `decodeAscii85() decodes ${standard} with delimiter`,
    fn() {
      for (const [bin, b85] of tests) {
        assertEquals(
          decodeAscii85(b85 as string, {
            standard: standard as Ascii85Standard,
          }),
          utf8encoder.encode(bin),
        );
      }
    },
  });
}

Deno.test({
  name: `encodeAscii85() encodes subarray of an Uint8Array`,
  fn() {
    const data1 = new Uint8Array([0x73, 0x70, 0x61, 0x6d]);
    const data2 = new Uint8Array(
      [0x01, 0x02, 0x03, 0x04, 0x73, 0x70, 0x61, 0x6d],
    );

    const encoded1 = encodeAscii85(data1);
    const encoded2 = encodeAscii85(data2.subarray(4));

    assertEquals(encoded1, "F)YQ)");
    assertEquals(encoded2, "F)YQ)");
  },
});

Deno.test({
  name: `decodeAscii85() decodes with default standard`,
  fn() {
    const tests = [
      ["<~FCfN8Bl7P~>", "testing"],
      ["<~A7]XsCgh3l~>", "denoland"],
      ["<~@<5pmBfIsm@:X:cAH~>", "ascii85 adobe"],
    ] as const;

    for (const [input, expect] of tests) {
      assertEquals(
        decodeAscii85(input),
        utf8encoder.encode(expect),
      );
    }
  },
});
