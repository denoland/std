// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  collectValues,
  type Comment,
  compareScore,
  createComment,
  createItem,
  createNotification,
  createUser,
  createVote,
  deleteComment,
  deleteItem,
  deleteNotification,
  deleteUserBySession,
  deleteVote,
  formatDate,
  getAreVotedBySessionId,
  getDatesSince,
  getItem,
  getManyMetrics,
  getNotification,
  getUser,
  getUserBySession,
  getUserByStripeCustomer,
  ifUserHasNotifications,
  incrVisitsCountByDay,
  type Item,
  listCommentsByItem,
  listItemsByTime,
  listItemsByUser,
  listItemsVotedByUser,
  listNotificationsByUser,
  newCommentProps,
  newItemProps,
  newNotificationProps,
  newUserProps,
  newVoteProps,
  Notification,
  updateUser,
  type User,
} from "./db.ts";
import {
  assert,
  assertArrayIncludes,
  assertEquals,
  assertRejects,
} from "std/testing/asserts.ts";
import { DAY } from "std/datetime/constants.ts";

export function genNewComment(): Comment {
  return {
    itemId: crypto.randomUUID(),
    userLogin: crypto.randomUUID(),
    text: crypto.randomUUID(),
    ...newCommentProps(),
  };
}

export function genNewItem(): Item {
  return {
    userLogin: crypto.randomUUID(),
    title: crypto.randomUUID(),
    url: `http://${crypto.randomUUID()}.com`,
    ...newItemProps(),
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
    userLogin: crypto.randomUUID(),
    type: crypto.randomUUID(),
    text: crypto.randomUUID(),
    originUrl: crypto.randomUUID(),
    ...newNotificationProps(),
  };
}

Deno.test("[db] newItemProps()", () => {
  const itemProps = newItemProps();
  assert(itemProps.createdAt.getTime() <= Date.now());
  assertEquals(typeof itemProps.id, "string");
  assertEquals(itemProps.score, 0);
});

Deno.test("[db] getAllItems()", async () => {
  const item1 = genNewItem();
  const item2 = genNewItem();

  assertEquals(await collectValues(listItemsByTime()), []);

  await createItem(item1);
  await createItem(item2);
  assertArrayIncludes(await collectValues(listItemsByTime()), [item1, item2]);
});

Deno.test("[db] (get/create/delete)Item()", async () => {
  const item = genNewItem();

  assertEquals(await getItem(item.id), null);

  const dates = [new Date()];
  const [itemsCount] = await getManyMetrics("items_count", dates);
  await createItem(item);
  assertEquals(await getManyMetrics("items_count", dates), [itemsCount + 1n]);
  await assertRejects(async () => await createItem(item));
  assertEquals(await getItem(item.id), item);

  await deleteItem(item);
  assertEquals(await getItem(item.id), null);
});

Deno.test("[db] getItemsByUser()", async () => {
  const userLogin = crypto.randomUUID();
  const item1 = { ...genNewItem(), userLogin };
  const item2 = { ...genNewItem(), userLogin };

  assertEquals(await collectValues(listItemsByUser(userLogin)), []);

  await createItem(item1);
  await createItem(item2);
  assertArrayIncludes(await collectValues(listItemsByUser(userLogin)), [
    item1,
    item2,
  ]);
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

Deno.test("[db] newCommentProps()", () => {
  const commentProps = newCommentProps();
  assert(commentProps.createdAt.getTime() <= Date.now());
  assertEquals(typeof commentProps.id, "string");
});

Deno.test("[db] (create/delete)Comment() + getCommentsByItem()", async () => {
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
  assertEquals(await collectValues(listCommentsByItem(itemId)), []);
});

Deno.test("[db] votes", async () => {
  const item = genNewItem();
  const user = genNewUser();
  const vote = {
    itemId: item.id,
    userLogin: user.login,
    ...newVoteProps(),
  };

  const dates = [vote.createdAt];
  assertEquals(await getManyMetrics("votes_count", dates), [0n]);
  assertEquals(await collectValues(listItemsVotedByUser(user.login)), []);

  // await assertRejects(async () => await createVote(vote));
  await createItem(item);
  await createUser(user);
  await createVote(vote);
  item.score++;

  assertEquals(await getManyMetrics("votes_count", dates), [1n]);
  assertEquals(await collectValues(listItemsVotedByUser(user.login)), [item]);
  // await assertRejects(async () => await createVote(vote));

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

Deno.test("[db] newNotificationProps()", () => {
  const notificationProps = newNotificationProps();
  assert(notificationProps.createdAt.getTime() <= Date.now());
  assertEquals(typeof notificationProps.id, "string");
});

Deno.test("[db] (get/create/delete)Notification()", async () => {
  const notification = genNewNotification();

  assertEquals(await getNotification(notification.id), null);

  await createNotification(notification);
  await assertRejects(async () => await createNotification(notification));
  assertEquals(await getNotification(notification.id), notification);

  await deleteNotification(notification);
  assertEquals(await getItem(notification.id), null);
});

Deno.test("[db] getNotificationsByUser()", async () => {
  const userLogin = crypto.randomUUID();
  const notification1 = { ...genNewNotification(), userLogin };
  const notification2 = { ...genNewNotification(), userLogin };

  assertEquals(await collectValues(listNotificationsByUser(userLogin)), []);
  assertEquals(await ifUserHasNotifications(userLogin), false);

  await createNotification(notification1);
  await createNotification(notification2);
  assertArrayIncludes(await collectValues(listNotificationsByUser(userLogin)), [
    notification1,
    notification2,
  ]);
  assertEquals(await ifUserHasNotifications(userLogin), true);
});

Deno.test("[db] compareScore()", () => {
  const item1: Item = {
    userLogin: crypto.randomUUID(),
    title: crypto.randomUUID(),
    url: `http://${crypto.randomUUID()}.com`,
    ...newItemProps(),
    score: 1,
  };
  const item2: Item = {
    userLogin: crypto.randomUUID(),
    title: crypto.randomUUID(),
    url: `http://${crypto.randomUUID()}.com`,
    ...newItemProps(),
    score: 2,
  };
  const item3: Item = {
    userLogin: crypto.randomUUID(),
    title: crypto.randomUUID(),
    url: `http://${crypto.randomUUID()}.com`,
    ...newItemProps(),
    score: 5,
  };

  const aa = [item2, item3, item1];
  const sorted = aa.toSorted(compareScore);

  assertArrayIncludes(sorted, [item1, item2, item3]);
});

Deno.test("[db] getAreVotedBySessionId()", async () => {
  const item = genNewItem();
  const user = genNewUser();
  const vote = {
    itemId: item.id,
    userLogin: user.login,
    ...newVoteProps(),
  };

  assertEquals(await getUserBySession(user.sessionId), null);
  assertEquals(await getItem(item.id), null);
  assertEquals(await getAreVotedBySessionId([item], user.sessionId), []);
  assertEquals(await getAreVotedBySessionId([item], undefined), []);
  assertEquals(
    await getAreVotedBySessionId([item], "not-a-session"),
    [],
  );
  assertEquals(
    await getAreVotedBySessionId([item], crypto.randomUUID()),
    [],
  );

  await createItem(item);
  await createUser(user);
  await createVote(vote);
  item.score++;

  assertEquals(await getItem(item.id), item);
  assertEquals(await getUserBySession(user.sessionId), user);

  assertEquals(await getAreVotedBySessionId([item], user.sessionId), [
    true,
  ]);
});
