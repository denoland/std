// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assert, assertGreater, assertLess } from "@std/assert";

function spawnDeno(args: string[], opts?: Deno.CommandOptions) {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", ...args],
    stdout: "piped",
    stderr: "piped",
    ...opts,
  });
  return cmd.spawn();
}

const normalizeString = (s: string) =>
  // deno-lint-ignore no-control-regex
  s.replace(/\r\n|\r|\n|\u001b\[[0-9;]*[a-zA-Z]/g, "").trim();

function isEqualUint8Array(arr1: Uint8Array, arr2: Uint8Array) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

Deno.test("Spinner constructor accepts spinner", async () => {
  const process = spawnDeno(["cli/testdata/spinner_cases/custom_spinner.ts"]);
  const output = await process.output();
  const text = new TextDecoder().decode(output.stdout);

  assert(normalizeString(text).startsWith("0 1 2 3 4 5 6 7 8 9"));
});

Deno.test("Spinner constructor accepts message", async () => {
  const process = spawnDeno([
    "cli/testdata/spinner_cases/custom_loading_text.ts",
  ]);
  const output = await process.output();
  const text = new TextDecoder().decode(output.stdout);

  assert(normalizeString(text).startsWith("⠋ Spinning with Deno 🦕"));
});

Deno.test("Spinner constructor accepts interval", async () => {
  const process1 = spawnDeno([
    "cli/testdata/spinner_cases/custom_interval_750.ts",
  ]);
  const output1 = await process1.output();
  const text1 = new TextDecoder().decode(output1.stdout);

  assertEquals(normalizeString(text1), "⠋");

  const process2 = spawnDeno([
    "cli/testdata/spinner_cases/custom_interval_10.ts",
  ]);
  const output2 = await process2.output();
  const text2 = new TextDecoder().decode(output2.stdout);

  assertGreater(normalizeString(text2).length, 150);
  assertLess(normalizeString(text2).length, 225);
});

Deno.test("Spinner constructor accepts each color", async () => {
  const COLOR_RESET = "\u001b[0m";
  const LINE_CLEAR = "\r\u001b[K";
  const encoder = new TextEncoder();

  const blackProcess = spawnDeno([
    "cli/testdata/spinner_cases/custom_color_black.ts",
  ]);
  const blackOutput = await blackProcess.output();
  const black = `${LINE_CLEAR}\u001b[30m⠋${COLOR_RESET} `;
  const blackArr = encoder.encode(black);
  assertEquals(blackOutput.stdout, blackArr);

  const redProcess = spawnDeno([
    "cli/testdata/spinner_cases/custom_color_red.ts",
  ]);
  const redOutput = await redProcess.output();
  const red = `${LINE_CLEAR}\u001b[31m⠋${COLOR_RESET} `;
  const redArr = encoder.encode(red);
  assertEquals(redOutput.stdout, redArr);

  const greenProcess = spawnDeno([
    "cli/testdata/spinner_cases/custom_color_green.ts",
  ]);
  const greenOutput = await greenProcess.output();
  const green = `${LINE_CLEAR}\u001b[32m⠋${COLOR_RESET} `;
  const greenArr = encoder.encode(green);
  assertEquals(greenOutput.stdout, greenArr);

  const yellowProcess = spawnDeno([
    "cli/testdata/spinner_cases/custom_color_yellow.ts",
  ]);
  const yellowOutput = await yellowProcess.output();
  const yellow = `${LINE_CLEAR}\u001b[33m⠋${COLOR_RESET} `;
  const yellowArr = encoder.encode(yellow);
  assertEquals(yellowOutput.stdout, yellowArr);

  const blueProcess = spawnDeno([
    "cli/testdata/spinner_cases/custom_color_blue.ts",
  ]);
  const blueOutput = await blueProcess.output();
  const blue = `${LINE_CLEAR}\u001b[34m⠋${COLOR_RESET} `;
  const blueArr = encoder.encode(blue);
  assertEquals(blueOutput.stdout, blueArr);

  // Magenta color test
  const magentaProcess = spawnDeno([
    "cli/testdata/spinner_cases/custom_color_magenta.ts",
  ]);
  const magentaOutput = await magentaProcess.output();
  const magenta = `${LINE_CLEAR}\u001b[35m⠋${COLOR_RESET} `;
  const magentaArr = encoder.encode(magenta);
  assertEquals(magentaOutput.stdout, magentaArr);

  const cyanProcess = spawnDeno([
    "cli/testdata/spinner_cases/custom_color_cyan.ts",
  ]);
  const cyanOutput = await cyanProcess.output();
  const cyan = `${LINE_CLEAR}\u001b[36m⠋${COLOR_RESET} `;
  const cyanArr = encoder.encode(cyan);
  assertEquals(cyanOutput.stdout, cyanArr);

  const whiteProcess = spawnDeno([
    "cli/testdata/spinner_cases/custom_color_white.ts",
  ]);
  const whiteOutput = await whiteProcess.output();
  const white = `${LINE_CLEAR}\u001b[37m⠋${COLOR_RESET} `;
  const whiteArr = encoder.encode(white);
  assertEquals(whiteOutput.stdout, whiteArr);

  const grayProcess = spawnDeno([
    "cli/testdata/spinner_cases/custom_color_gray.ts",
  ]);
  const grayOutput = await grayProcess.output();
  const gray = `${LINE_CLEAR}\u001b[90m⠋${COLOR_RESET} `;
  const grayArr = encoder.encode(gray);
  assertEquals(grayOutput.stdout, grayArr);
});
