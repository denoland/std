import { CSVStream } from "./stream.ts";
import { readableStreamFromIterable } from "../../streams/conversion.ts";
import { assertEquals } from "../../testing/asserts.ts";
import { fromFileUrl, join } from "../../path/mod.ts";

const testdataDir = join(fromFileUrl(import.meta.url), "../../testdata");

Deno.test("[encoding/csv/stream] CSVStream", async () => {
  const file = await Deno.open(join(testdataDir, "simple.csv"));
  const readable = file.readable.pipeThrough(new CSVStream());
  const records = [] as Array<Array<string>>;
  for await (const record of readable) {
    records.push(record);
  }
  assertEquals(records, [
    ["id", "name"],
    ["1", "foobar"],
    ["2", "barbaz"],
  ]);
});

Deno.test("[encoding/csv/stream] CSVStream with `comment` option", async () => {
  const file = await Deno.open(join(testdataDir, "complex.csv"));
  const readable = file.readable.pipeThrough(
    new CSVStream({
      comment: "#",
    }),
  );
  const records = [] as Array<Array<string>>;
  for await (const record of readable) {
    records.push(record);
  }
  assertEquals(records, [
    ["id", "name", "email"],
    ["1", "deno", "deno@example.com"],
    ["2", "node", "node@example.com"],
    ["3", "", "test@example.com"],
  ]);
});

Deno.test("[encoding/csv/stream] CSVStream with `separator` option", async () => {
  const encoder = new TextEncoder();
  const readable = readableStreamFromIterable([
    encoder.encode("id\tname\n"),
    encoder.encode("1\tfoo\n"),
    encoder.encode("2\tbar\n"),
    encoder.encode("3\tbaz\n"),
  ]).pipeThrough(
    new CSVStream({
      separator: "\t",
    }),
  );
  const records = [] as Array<Array<string>>;
  for await (const record of readable) {
    records.push(record);
  }
  assertEquals(records, [
    ["id", "name"],
    ["1", "foo"],
    ["2", "bar"],
    ["3", "baz"],
  ]);
});
