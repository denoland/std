// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { Conn, dial } from "deno";
import { assert, assertEqual, test } from "../testing/mod.ts";
import { User, parse, IrcServer } from "./irc.ts";
import { TextProtoReader } from "../net/textproto.ts";
import { BufReader, BufState } from "../net/bufio.ts";

test(function userModes() {
  // use empty object, as we're not testing connections here
  const user = new User({} as Conn);
  assert(!user.isInvisible);
  assert(!user.isOp);
  assert(!user.isLocalOp);
  assert(!user.isWallops);

  user.isInvisible = true;
  user.isOp = true;

  assert(user.isInvisible);
  assert(user.isOp);

  user.isInvisible = false;
  user.isOp = false;
  assert(!user.isInvisible);
  assert(!user.isOp);

  user.isLocalOp = true;
  user.isWallops = true;
  assert(user.isLocalOp);
  assert(user.isWallops);

  user.isLocalOp = false;
  user.isWallops = false;
  assert(!user.isLocalOp);
  assert(!user.isWallops);
});

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

const TEST_ADDRESS = "127.0.0.1:";
let PORT = 25567;
const disconnectError = new Error("Client was disconnected.");

// ! test hangs for some reason
test(async function NICKerrors() {
  const THIS_ADDRESS = TEST_ADDRESS + PORT++;

  const server = new IrcServer(THIS_ADDRESS);
  // test SHOULD complete in this time
  const timerID = setTimeout(() => {
    throw new Error("Test did not complete in time.");
  }, 3000);
  server.start();
  const encoder = new TextEncoder();
  const client1 = await dial("tcp", THIS_ADDRESS);
  const client1reader = new TextProtoReader(new BufReader(client1));

  // no nickname given
  const nickError431 = "NICK \r\n";

  let encodedMsg = encoder.encode(nickError431);
  await client1.write(encodedMsg);

  let incomingMsg: string;
  let err: BufState;

  [incomingMsg, err] = await client1reader.readLine();
  if (err === "EOF") {
    throw disconnectError;
  }
  assertEqual(incomingMsg, ":127.0.0.1 431 * :No nickname given");

  // now test two users attempting to register the same nickname

  const nickError433 = "NICK nickname\r\n";
  encodedMsg = encoder.encode(nickError433);

  await client1.write(encodedMsg);
  const client2 = await dial("tcp", THIS_ADDRESS);
  const client2reader = new TextProtoReader(new BufReader(client2));
  await client2.write(encodedMsg);

  [incomingMsg, err] = await client2reader.readLine();
  if (err === "EOF") {
    throw disconnectError;
  }

  assertEqual(
    incomingMsg,
    ':127.0.0.1 433 * :Nickname "nickname" has already been taken.'
  );

  clearTimeout(timerID);
  client1.close();
  client2.close();
  server.close();
});

test(async function USERerrors() {
  const THIS_ADDRESS = TEST_ADDRESS + PORT++;

  const server = new IrcServer(THIS_ADDRESS);
  // test SHOULD complete in this time
  const timerID = setTimeout(() => {
    throw new Error("Test did not complete in time.");
  }, 3000);
  server.start();

  const client1 = await dial("tcp", THIS_ADDRESS);
  const client1reader = new TextProtoReader(new BufReader(client1));
  const encoder = new TextEncoder();

  // not enough params
  const userError461 = "USER\r\n";
  let encodedMsg = encoder.encode(userError461);
  await client1.write(encodedMsg);

  let incomingMsg: string;
  let err: BufState;

  [incomingMsg, err] = await client1reader.readLine();
  if (err === "EOF") {
    throw disconnectError;
  }

  assertEqual(incomingMsg, ":127.0.0.1 461 * :Wrong params for USER command");

  // then test if user is already registered

  const nickMsg = encoder.encode("NICK nickname\r\n");
  const firstUserMsg = encoder.encode("USER username 0 * :Full Name\r\n");
  const secondUserMsg = encoder.encode("USER othername 0 * :Other Name\r\n");

  await client1.write(nickMsg);
  await client1.write(firstUserMsg);

  [incomingMsg, err] = await client1reader.readLine();
  if (err === "EOF") {
    throw disconnectError;
  }

  assertEqual(
    incomingMsg,
    ":127.0.0.1 001 nickname :Welcome to the server nickname"
  );

  await client1.write(secondUserMsg);

  [incomingMsg, err] = await client1reader.readLine();
  if (err === "EOF") {
    throw disconnectError;
  }

  assertEqual(incomingMsg, ":127.0.0.1 462 nickname :Cannot register twice");

  clearTimeout(timerID);
  client1.close();
  server.close();
});
