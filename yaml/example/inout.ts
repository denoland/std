import { parse, stringify } from "../mod.ts";

const test = {
  foo: {
    bar: true,
    test: [
      "a",
      "b",
      {
        a: false
      },
      {
        a: false
      }
    ]
  },
  test: "foobar"
};

const string = stringify(test);
if (Deno.inspect(test) === Deno.inspect(parse(string))) {
  console.log("In-Out as expected.");
} else {
  console.log("Someting went wrong.");
}
