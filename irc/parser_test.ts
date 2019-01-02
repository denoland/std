// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { assertEqual, test } from "./package.ts";
import { parse } from "./parser.ts";

// tests using valid IRC messages
test(function message252() {
  const message252 =
    "@url=sdf :verne.freenode.net 252 rahat2 33 :IRC Operators online";
  const parsed252 = parse(message252);

  assertEqual(parsed252, {
    tags: { url: "sdf" },
    prefix: ":verne.freenode.net",
    command: "252",
    params: ["rahat2", "33", ":IRC Operators online"]
  });
});

test(function messageUSER() {
  const messageUser = "USER rahat_ahmed these_params dont_matter :Rahat Ahmed";
  const parsedUser = parse(messageUser);

  assertEqual(parsedUser, {
    tags: {},
    prefix: "",
    command: "USER",
    params: ["rahat_ahmed", "these_params", "dont_matter", ":Rahat Ahmed"]
  });
});
