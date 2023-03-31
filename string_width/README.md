# string_width

Get the expected physical column width of a string in TTY-like environments.

Combines a TypeScript port of the
[unicode-width Rust crate](https://github.com/unicode-rs/unicode-width/), which
looks up the nominal width of Unicode characters, with a port of
[chalk/strip-ansi](https://github.com/chalk/strip-ansi), which strips out ANSI
escape sequences.

## Usage

```ts
import { stringWidth } from "https://deno.land/std@$STD_VERSION/string_width/string_width.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

assertEquals(stringWidth("hello world"), 11);
assertEquals(stringWidth("\x1b[36mCYAN\x1b[0m"), 4);
assertEquals(stringWidth("天地玄黃宇宙洪荒"), 16);
assertEquals(stringWidth("ｆｕｌｌｗｉｄｔｈ＿ｔｅｘｔ"), 28);
assertEquals(
  stringWidth("\x1B]8;;https://deno.land\x07Deno 🦕\x1B]8;;\x07"),
  7,
);
```

## Examples

### Drawing line art in the terminal

```ts
import { stringWidth } from "https://deno.land/std@$STD_VERSION/string_width/string_width.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

function drawRect(str: string) {
  const width = stringWidth(str);
  const line = "-".repeat(width + 4);

  return `${line}\n| ${str} |\n${line}`;
}

assertEquals(
  drawRect("abc"),
  `
-------
| abc |
-------
`.trim(),
);

assertEquals(
  drawRect("🦕"),
  `
------
| 🦕 |
------
`.trim(),
);
```

### Calculating console line wrap

```ts
import { stringWidth } from "https://deno.land/std@$STD_VERSION/string_width/string_width.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

function numPhysicalConsoleLines(str: string) {
  const { columns } = Deno.consoleSize();
  return Math.ceil(stringWidth(str) / columns);
}

// assuming `Deno.consoleSize().columns` is 120...
assertEquals(numPhysicalConsoleLines("a".repeat(100)), 1);
assertEquals(numPhysicalConsoleLines("文".repeat(100)), 2);
```
