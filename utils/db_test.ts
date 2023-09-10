// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  collectValues,
  type Comment,
  createComment,
  createItem,
  createNotification,
  createUser,
  createVote,
  deleteComment,
  deleteItem,
  deleteUserBySession,
  deleteVote,
  formatDate,
  getAndDeleteNotification,
  getAreVotedByUser,
  getDatesSince,
  getItem,
  getManyMetrics,
  getUser,
  getUserBySession,
  getUserByStripeCustomer,
  ifUserHasNotifications,
  incrVisitsCountByDay,
  type Item,
  kv,
  listCommentsByItem,
  listItems,
  listItemsByUser,
  listItemsVotedByUser,
  listNotifications,
  newUserProps,
  Notification,
  updateUser,
  type User,
} from "./db.ts";
import {
  assertArrayIncludes,
  assertEquals,
  assertRejects,
} from "std/assert/mod.ts";
import { DAY } from "std/datetime/constants.ts";
import { ulid } from "std/ulid/mod.ts";

export function genNewComment(): Comment {
  return {
    id: ulid(),
    itemId: crypto.randomUUID(),
    userLogin: crypto.randomUUID(),
    text: crypto.randomUUID(),
  };
}

export function genNewItem(): Item {
  return {
    id: ulid(),
    userLogin: crypto.randomUUID(),
    title: crypto.randomUUID(),
    url: `http://${crypto.randomUUID()}.com`,
    score: 0,
  };
}

export function genNewUser(): User {
  return {
    login: crypto.randomUUID(),
    sessionId: crypto.randomUUID(),
    stripeCustomerId: crypto.randomUUID(),
    ...newUserProps(),
  };
}

export function genNewNotification(): Notification {
  return {
    id: ulid(),
    userLogin: crypto.randomUUID(),
    type: crypto.randomUUID(),
    text: crypto.randomUUID(),
    originUrl: crypto.randomUUID(),
  };
}

Deno.test("[db] items", async () => {
  const user = genNewUser();
  const item1: Item = {
    ...genNewItem(),
    id: ulid(),
    userLogin: user.login,
  };
  const item2: Item = {
    ...genNewItem(),
    id: ulid(Date.now() + 1_000),
    userLogin: user.login,
  };

  assertEquals(await getItem(item1.id), null);
  assertEquals(await getItem(item2.id), null);
  assertEquals(await collectValues(listItems()), []);
  assertEquals(await collectValues(listItemsByUser(user.login)), []);
  await assertRejects(async () => await deleteItem(item1), "Item not found");

  await createItem(item1);
  await createItem(item2);
  await assertRejects(async () => await createItem(item1));

  assertEquals(await getItem(item1.id), item1);
  assertEquals(await getItem(item2.id), item2);
  assertEquals(await collectValues(listItems()), [item1, item2]);
  assertEquals(await collectValues(listItemsByUser(user.login)), [
    item1,
    item2,
  ]);

  await deleteItem(item1);
  await deleteItem(item2);

  assertEquals(await getItem(item1.id), null);
  assertEquals(await getItem(item1.id), null);
  assertEquals(await collectValues(listItems()), []);
  assertEquals(await collectValues(listItemsByUser(user.login)), []);
});

Deno.test("[db] user", async () => {
  const user = genNewUser();

  assertEquals(await getUser(user.login), null);
  assertEquals(await getUserBySession(user.sessionId), null);
  assertEquals(await getUserByStripeCustomer(user.stripeCustomerId!), null);

  await createUser(user);
  await assertRejects(async () => await createUser(user));
  assertEquals(await getManyMetrics("users_count", [new Date()]), [1n]);
  assertEquals(await getUser(user.login), user);
  assertEquals(await getUserBySession(user.sessionId), user);
  assertEquals(await getUserByStripeCustomer(user.stripeCustomerId!), user);

  const user1 = genNewUser();
  await createUser(user1);

  await deleteUserBySession(user.sessionId);
  assertEquals(await getUserBySession(user.sessionId), null);

  const newUser: User = { ...user, sessionId: crypto.randomUUID() };
  await updateUser(newUser);
  assertEquals(await getUser(newUser.login), newUser);
  assertEquals(await getUserBySession(newUser.sessionId), newUser);
  assertEquals(
    await getUserByStripeCustomer(newUser.stripeCustomerId!),
    newUser,
  );
});

Deno.test("[db] visit", async () => {
  const date = new Date();
  await incrVisitsCountByDay(date);
  assertEquals(await getManyMetrics("visits_count", [date]), [1n]);
});

Deno.test("[db] comments", async () => {
  const itemId = crypto.randomUUID();
  const comment1 = { ...genNewComment(), itemId };
  const comment2 = { ...genNewComment(), itemId };

  assertEquals(await collectValues(listCommentsByItem(itemId)), []);

  await createComment(comment1);
  await createComment(comment2);
  await assertRejects(async () => await createComment(comment2));
  assertArrayIncludes(await collectValues(listCommentsByItem(itemId)), [
    comment1,
    comment2,
  ]);

  await deleteComment(comment1);
  await deleteComment(comment2);
  await assertRejects(
    async () => await deleteComment(comment1),
    "Comment not found",
  );
  assertEquals(await collectValues(listCommentsByItem(itemId)), []);
});

Deno.test("[db] votes", async () => {
  const item = genNewItem();
  const user = genNewUser();
  const vote = {
    itemId: item.id,
    userLogin: user.login,
    createdAt: new Date(),
  };

  const dates = [vote.createdAt];
  assertEquals(await getManyMetrics("votes_count", dates), [0n]);
  assertEquals(await collectValues(listItemsVotedByUser(user.login)), []);

  await assertRejects(
    async () => await createVote(vote),
    Deno.errors.NotFound,
    "Item not found",
  );
  await createItem(item);
  await assertRejects(
    async () => await createVote(vote),
    Deno.errors.NotFound,
    "User not found",
  );
  await createUser(user);
  await createVote(vote);
  item.score++;

  assertEquals(await getManyMetrics("votes_count", dates), [1n]);
  assertEquals(await collectValues(listItemsVotedByUser(user.login)), [item]);
  await assertRejects(async () => await createVote(vote));

  await deleteItem(item);
  await assertRejects(
    async () => await deleteVote(vote),
    Deno.errors.NotFound,
    "Item not found",
  );
  await createItem(item);

  /** @todo(iuioiua) Replace with `deleteUser()` once implemented */
  await kv.delete(["users", user.login]);
  await assertRejects(
    async () => await deleteVote(vote),
    Deno.errors.NotFound,
    "User not found",
  );
  /** @todo(iuioiua) Replace with `createUser()` once `deleteUser()` is implemented */
  await kv.set(["users", user.login], user);

  await kv.delete(["items_voted_by_user", user.login, item.id]);
  await assertRejects(
    async () => await deleteVote(vote),
    Deno.errors.NotFound,
    "Item voted by user not found",
  );
  await kv.set(["items_voted_by_user", user.login, item.id], item);

  await kv.delete(["users_voted_for_item", item.id, user.login]);
  await assertRejects(
    async () => await deleteVote(vote),
    Deno.errors.NotFound,
    "User voted for item not found",
  );
  await kv.set(["users_voted_for_item", item.id, user.login], user);

  await deleteVote(vote);
  assertEquals(await getManyMetrics("votes_count", dates), [1n]);
  assertEquals(await collectValues(listItemsVotedByUser(user.login)), []);
});

Deno.test("[db] getManyMetrics()", async () => {
  const last5Days = getDatesSince(DAY * 5).map((date) => new Date(date));
  const last30Days = getDatesSince(DAY * 30).map((date) => new Date(date));

  assertEquals((await getManyMetrics("items_count", last5Days)).length, 5);
  assertEquals((await getManyMetrics("items_count", last30Days)).length, 30);
});

Deno.test("[db] formatDate()", () => {
  assertEquals(formatDate(new Date("2023-01-01")), "2023-01-01");
  assertEquals(formatDate(new Date("2023-01-01T13:59:08.740Z")), "2023-01-01");
});

Deno.test("[db] getDatesSince()", () => {
  assertEquals(getDatesSince(0), []);
  assertEquals(getDatesSince(DAY), [formatDate(new Date())]);
  assertEquals(getDatesSince(DAY * 2), [
    formatDate(new Date(Date.now() - DAY)),
    formatDate(new Date()),
  ]);
});

Deno.test("[db] notifications", async () => {
  const userLogin = crypto.randomUUID();
  const notification1 = { ...genNewNotification(), userLogin };
  const notification2 = {
    ...genNewNotification(),
    userLogin,
    id: ulid(Date.now() + 1_000),
  };

  await assertRejects(
    async () => await getAndDeleteNotification(notification1),
    Deno.errors.NotFound,
    "Notification not found",
  );
  await assertRejects(
    async () => await getAndDeleteNotification(notification2),
    Deno.errors.NotFound,
    "Notification not found",
  );

  assertEquals(await collectValues(listNotifications(userLogin)), []);
  assertEquals(await ifUserHasNotifications(userLogin), false);

  await createNotification(notification1);
  await createNotification(notification2);
  await assertRejects(
    async () => await createNotification(notification1),
    "Failed to create notification",
  );

  assertEquals(await ifUserHasNotifications(userLogin), true);
  assertEquals(await collectValues(listNotifications(userLogin)), [
    notification1,
    notification2,
  ]);
  assertEquals(await getAndDeleteNotification(notification1), notification1);
  assertEquals(await getAndDeleteNotification(notification2), notification2);

  assertEquals(await collectValues(listNotifications(userLogin)), []);
  assertEquals(await ifUserHasNotifications(userLogin), false);
  await assertRejects(
    async () => await getAndDeleteNotification(notification1),
    Deno.errors.NotFound,
    "Notification not found",
  );
  await assertRejects(
    async () => await getAndDeleteNotification(notification2),
    Deno.errors.NotFound,
    "Notification not found",
  );
});

Deno.test("[db] getAreVotedByUser()", async () => {
  const item = genNewItem();
  const user = genNewUser();
  const vote = {
    itemId: item.id,
    userLogin: user.login,
    createdAt: new Date(),
  };

  assertEquals(await getItem(item.id), null);
  assertEquals(await getUser(user.login), null);
  assertEquals(await getAreVotedByUser([item], user.login), [false]);

  await createItem(item);
  await createUser(user);
  await createVote(vote);
  item.score++;

  assertEquals(await getItem(item.id), item);
  assertEquals(await getUser(user.login), user);
  assertEquals(await getAreVotedByUser([item], user.login), [true]);
});
