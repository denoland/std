// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  type Comment,
  createComment,
  createItem,
  createUser,
  getAllItems,
  getCommentsByItem,
  getItem,
  getItemsByUser,
  getItemsSince,
  getUserById,
  getUserByLogin,
  getUserBySessionId,
  getUserByStripeCustomerId,
  getVisitsPerDay,
  incrementVisitsPerDay,
  type Item,
  kv,
  newCommentProps,
  newItemProps,
  setUserSessionId,
  updateUserIsSubscribed,
  type User,
} from "./db.ts";
import {
  assertAlmostEquals,
  assertArrayIncludes,
  assertEquals,
  assertRejects,
} from "std/testing/asserts.ts";
import { DAY } from "std/datetime/constants.ts";

async function deleteUser(user: User) {
  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.login];
  const usersBySessionKey = ["users_by_session", user.sessionId];
  const usersByStripeCustomerKey = [
    "users_by_stripe_customer",
    user.stripeCustomerId,
  ];

  const [
    userRes,
    userByLoginRes,
    userBySessionRes,
    userByStripeCustomerRes,
  ] = await kv.getMany<User[]>([
    usersKey,
    usersByLoginKey,
    usersBySessionKey,
    usersByStripeCustomerKey,
  ]);

  const res = await kv.atomic()
    .check(userRes)
    .check(userByLoginRes)
    .check(userBySessionRes)
    .check(userByStripeCustomerRes)
    .delete(usersKey)
    .delete(usersByLoginKey)
    .delete(usersBySessionKey)
    .delete(usersByStripeCustomerKey)
    .commit();

  if (!res.ok) {
    throw res;
  }
}

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

Deno.test("[db] user", async () => {
  const initUser = {
    id: crypto.randomUUID(),
    login: crypto.randomUUID(),
    avatarUrl: "https://example.com",
    stripeCustomerId: crypto.randomUUID(),
    sessionId: crypto.randomUUID(),
  };

  await createUser(initUser);
  let user = { ...initUser, isSubscribed: false } as User;
  assertEquals(await getUserById(user.id), user);
  assertEquals(await getUserByLogin(user.login), user);
  assertEquals(await getUserBySessionId(user.sessionId), user);
  assertEquals(await getUserByStripeCustomerId(user.stripeCustomerId), user);

  await updateUserIsSubscribed(user, true);
  user = { ...user, isSubscribed: true };
  assertEquals(await getUserById(user.id), user);
  assertEquals(await getUserByLogin(user.login), user);
  assertEquals(await getUserBySessionId(user.sessionId), user);
  assertEquals(await getUserByStripeCustomerId(user.stripeCustomerId), user);

  const sessionId = crypto.randomUUID();
  await setUserSessionId(user, sessionId);
  user = { ...user, sessionId };
  assertEquals(await getUserById(user.id), user);
  assertEquals(await getUserByLogin(user.login), user);
  assertEquals(await getUserBySessionId(user.sessionId), user);
  assertEquals(await getUserByStripeCustomerId(user.stripeCustomerId), user);

  await deleteUser(user);
  assertEquals(await getUserById(user.id), null);
  assertEquals(await getUserByLogin(user.login), null);
  assertEquals(await getUserBySessionId(user.sessionId), null);
  assertEquals(await getUserByStripeCustomerId(user.stripeCustomerId), null);
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
