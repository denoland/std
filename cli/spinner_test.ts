// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals, assertGreater, assertLess } from "@std/assert";
import { Spinner } from "./spinner.ts";

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

const COLOR_RESET = "\u001b[0m";
const LINE_CLEAR = "\r\u001b[K";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

Deno.test("Spinner constructor accepts spinner", async () => {
  const process = spawnDeno(["cli/testdata/spinner_cases/custom_spinner.ts"]);
  const output = await process.output();
  const text = decoder.decode(output.stdout);
  const actual = normalizeString(text);

  assert(actual.startsWith("0 1 2 3 4 5 6 7 8 9"));
});

Deno.test("Spinner constructor accepts message", async () => {
  const process = spawnDeno(["cli/testdata/spinner_cases/custom_message.ts"]);
  const output = await process.output();
  const text = decoder.decode(output.stdout);
  const actual = normalizeString(text);

  assert(actual.startsWith("⠋ Spinning with Deno 🦕"));
});

Deno.test("Spinner constructor accepts interval", async () => {
  const process1 = spawnDeno([
    "cli/testdata/spinner_cases/custom_interval_750.ts",
  ]);
  const output1 = await process1.output();
  const text1 = decoder.decode(output1.stdout);
  const actual1 = normalizeString(text1);

  // means it only ran once
  assertEquals(actual1, "⠋");

  const process2 = spawnDeno([
    "cli/testdata/spinner_cases/custom_interval_10.ts",
  ]);
  const output2 = await process2.output();
  const text2 = decoder.decode(output2.stdout);
  const actual2 = normalizeString(text2);

  // give setInterval a good buffer to avoid needlessly failing
  assertGreater(actual2.length, 100);
  assertLess(actual2.length, 300);
});

Deno.test("Spinner constructor accepts each color", async () => {
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

Deno.test("Spinner.color can set each color", async () => {
  const process = spawnDeno(["cli/testdata/spinner_cases/set_color.ts"]);
  const output = await process.output();

  const expectedStr = `${LINE_CLEAR}\u001b[30m⠋${COLOR_RESET} ` + // Black
    `${LINE_CLEAR}\u001b[31m⠙${COLOR_RESET} ` + // Red
    `${LINE_CLEAR}\u001b[32m⠹${COLOR_RESET} `; // Green
  const expected = encoder.encode(expectedStr);

  assertEquals(output.stdout, expected);
});

Deno.test("Spinner.color can get each color", () => {
  const spinner = new Spinner();

  spinner.color = "black";
  assertEquals(spinner.color, "\u001b[30m");

  spinner.color = "red";
  assertEquals(spinner.color, "\u001b[31m");

  spinner.color = "green";
  assertEquals(spinner.color, "\u001b[32m");

  spinner.color = "yellow";
  assertEquals(spinner.color, "\u001b[33m");

  spinner.color = "blue";
  assertEquals(spinner.color, "\u001b[34m");

  spinner.color = "magenta";
  assertEquals(spinner.color, "\u001b[35m");

  spinner.color = "cyan";
  assertEquals(spinner.color, "\u001b[36m");

  spinner.color = "white";
  assertEquals(spinner.color, "\u001b[37m");

  spinner.color = "gray";
  assertEquals(spinner.color, "\u001b[90m");
});

Deno.test("Spinner.start() begins the sequence", async () => {
  const process = spawnDeno(["cli/testdata/spinner_cases/start.ts"]);
  const output = await process.output();

  const expected = encoder.encode(`${LINE_CLEAR}⠋${COLOR_RESET} `);

  assertEquals(output.stdout, expected);
});

Deno.test("Spinner.stop() terminates the sequence", async () => {
  const process = spawnDeno(["cli/testdata/spinner_cases/stop.ts"]);
  const output = await process.output();

  const expected = encoder.encode(
    `${LINE_CLEAR}⠋${COLOR_RESET} ${LINE_CLEAR}⠙${COLOR_RESET} `,
  );

  assertEquals(output.stdout, expected);
});

Deno.test("Spinner.message can be updated", async () => {
  const process = spawnDeno(["cli/testdata/spinner_cases/change_message.ts"]);
  const output = await process.output();
  const text = decoder.decode(output.stdout);
  const actual = normalizeString(text);

  const expected = "⠋ ⠙ One dino 🦕⠹ Two dinos 🦕🦕⠸ Three dinos 🦕🦕🦕";

  assertEquals(actual, expected);
});
