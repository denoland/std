// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  type Comment,
  createComment,
  createItem,
  createUser,
  deleteUserBySession,
  getAllItems,
  getCommentsByItem,
  getItem,
  getItemsByUser,
  getItemsSince,
  getManyUsers,
  getUser,
  getUserByLogin,
  getUserBySession,
  getUserByStripeCustomer,
  getVisitsPerDay,
  incrementVisitsPerDay,
  type Item,
  kv,
  newCommentProps,
  newItemProps,
  newUserProps,
  updateUser,
  type User,
} from "./db.ts";
import {
  assertAlmostEquals,
  assertArrayIncludes,
  assertEquals,
  assertRejects,
} from "std/testing/asserts.ts";
import { DAY } from "std/datetime/constants.ts";

Deno.test("[db] newItemProps()", () => {
  const itemProps = newItemProps();
  assertAlmostEquals(itemProps.createdAt.getTime(), Date.now());
  assertEquals(typeof itemProps.id, "string");
  assertEquals(itemProps.score, 0);
});

Deno.test("[db] getAllItems()", async () => {
  const item1: Item = {
    userId: crypto.randomUUID(),
    title: crypto.randomUUID(),
    url: `http://${crypto.randomUUID()}.com`,
    ...newItemProps(),
  };
  const item2: Item = {
    userId: crypto.randomUUID(),
    title: crypto.randomUUID(),
    url: `http://${crypto.randomUUID()}.com`,
    ...newItemProps(),
  };

  assertEquals(await getAllItems(), []);

  await createItem(item1);
  await createItem(item2);
  assertArrayIncludes(await getAllItems(), [item1, item2]);
});

Deno.test("[db] (get/create)Item()", async () => {
  const item: Item = {
    userId: crypto.randomUUID(),
    title: crypto.randomUUID(),
    url: `http://${crypto.randomUUID()}.com`,
    ...newItemProps(),
  };

  assertEquals(await getItem(item.id), null);

  await createItem(item);
  await assertRejects(async () => await createItem(item));
  assertEquals(await getItem(item.id), item);
});

Deno.test("[db] getItemsByUser()", async () => {
  const userId = crypto.randomUUID();
  const item1: Item = {
    userId,
    title: crypto.randomUUID(),
    url: `http://${crypto.randomUUID()}.com`,
    ...newItemProps(),
  };
  const item2: Item = {
    userId,
    title: crypto.randomUUID(),
    url: `http://${crypto.randomUUID()}.com`,
    ...newItemProps(),
  };

  assertEquals(await getItemsByUser(userId), []);

  await createItem(item1);
  await createItem(item2);
  assertArrayIncludes(await getItemsByUser(userId), [item1, item2]);
});

Deno.test("[db] getItemsSince()", async () => {
  const item1: Item = {
    userId: crypto.randomUUID(),
    title: crypto.randomUUID(),
    url: `http://${crypto.randomUUID()}.com`,
    ...newItemProps(),
  };
  const item2: Item = {
    userId: crypto.randomUUID(),
    title: crypto.randomUUID(),
    url: `http://${crypto.randomUUID()}.com`,
    ...newItemProps(),
    createdAt: new Date(Date.now() - (2 * DAY)),
  };

  await createItem(item1);
  await createItem(item2);

  assertArrayIncludes(await getItemsSince(DAY), [item1]);
  assertArrayIncludes(await getItemsSince(3 * DAY), [item1, item2]);
});

function genNewUser(): User {
  return {
    id: crypto.randomUUID(),
    login: crypto.randomUUID(),
    avatarUrl: `http://${crypto.randomUUID()}`,
    sessionId: crypto.randomUUID(),
    stripeCustomerId: crypto.randomUUID(),
    ...newUserProps(),
  };
}

Deno.test("[db] user", async () => {
  const user = genNewUser();

  assertEquals(await getUser(user.id), null);
  assertEquals(await getUserByLogin(user.login), null);
  assertEquals(await getUserBySession(user.sessionId), null);
  assertEquals(await getUserByStripeCustomer(user.stripeCustomerId!), null);

  await createUser(user);
  await assertRejects(async () => await createUser(user));
  assertEquals(await getUser(user.id), user);
  assertEquals(await getUserByLogin(user.login), user);
  assertEquals(await getUserBySession(user.sessionId), user);
  assertEquals(await getUserByStripeCustomer(user.stripeCustomerId!), user);

  const user1 = genNewUser();
  await createUser(user1);
  assertArrayIncludes(await getManyUsers([user.id, user1.id]), [user, user1]);

  await deleteUserBySession(user.sessionId);
  assertEquals(await getUserBySession(user.sessionId), null);

  const newUser: User = { ...user, sessionId: crypto.randomUUID() };
  await updateUser(newUser);
  assertEquals(await getUser(newUser.id), newUser);
  assertEquals(await getUserByLogin(newUser.login), newUser);
  assertEquals(await getUserBySession(newUser.sessionId), newUser);
  assertEquals(
    await getUserByStripeCustomer(newUser.stripeCustomerId!),
    newUser,
  );
});

Deno.test("[db] visit", async () => {
  const date = new Date("2023-01-01");
  const visitsKey = [
    "visits",
    `${date.toISOString().split("T")[0]}`,
  ];
  await incrementVisitsPerDay(date);
  assertEquals((await kv.get(visitsKey)).key[1], "2023-01-01");
  assertEquals((await getVisitsPerDay(date))!.valueOf(), 1n);
  await kv.delete(visitsKey);
  assertEquals(await getVisitsPerDay(date), null);
});

Deno.test("[db] newCommentProps()", () => {
  const commentProps = newCommentProps();
  assertAlmostEquals(commentProps.createdAt.getTime(), Date.now());
  assertEquals(typeof commentProps.id, "string");
});

Deno.test("[db] createComment() + getCommentsByItem()", async () => {
  const itemId = crypto.randomUUID();
  const comment1: Comment = {
    itemId,
    userId: crypto.randomUUID(),
    text: crypto.randomUUID(),
    ...newCommentProps(),
  };
  const comment2: Comment = {
    itemId,
    userId: crypto.randomUUID(),
    text: crypto.randomUUID(),
    ...newCommentProps(),
  };

  assertEquals(await getCommentsByItem(itemId), []);

  await createComment(comment1);
  await createComment(comment2);
  await assertRejects(async () => await createComment(comment2));
  assertArrayIncludes(await getCommentsByItem(itemId), [comment1, comment2]);
});
