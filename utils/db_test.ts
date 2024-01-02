// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertRejects } from "std/assert/mod.ts";
import { ulid } from "std/ulid/mod.ts";
import {
  collectValues,
  createItem,
  createUser,
  createVote,
  getAreVotedByUser,
  getItem,
  getUser,
  getUserBySession,
  getUserByStripeCustomer,
  type Item,
  listItems,
  listItemsByUser,
  listItemsVotedByUser,
  randomItem,
  randomUser,
  updateUser,
  updateUserSession,
  type User,
} from "./db.ts";

Deno.test("[db] items", async () => {
  const user = randomUser();
  const item1: Item = {
    ...randomItem(),
    id: ulid(),
    userLogin: user.login,
  };
  const item2: Item = {
    ...randomItem(),
    id: ulid(Date.now() + 1_000),
    userLogin: user.login,
  };

  assertEquals(await getItem(item1.id), null);
  assertEquals(await getItem(item2.id), null);
  assertEquals(await collectValues(listItems()), []);
  assertEquals(await collectValues(listItemsByUser(user.login)), []);

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
});

Deno.test("[db] user", async () => {
  const user = randomUser();

  assertEquals(await getUser(user.login), null);
  assertEquals(await getUserBySession(user.sessionId), null);
  assertEquals(await getUserByStripeCustomer(user.stripeCustomerId!), null);

  await createUser(user);
  await assertRejects(async () => await createUser(user));
  assertEquals(await getUser(user.login), user);
  assertEquals(await getUserBySession(user.sessionId), user);
  assertEquals(await getUserByStripeCustomer(user.stripeCustomerId!), user);

  const subscribedUser: User = { ...user, isSubscribed: true };
  await updateUser(subscribedUser);
  assertEquals(await getUser(subscribedUser.login), subscribedUser);
  assertEquals(
    await getUserBySession(subscribedUser.sessionId),
    subscribedUser,
  );
  assertEquals(
    await getUserByStripeCustomer(subscribedUser.stripeCustomerId!),
    subscribedUser,
  );

  const newSessionId = crypto.randomUUID();
  await updateUserSession(user, newSessionId);
  assertEquals(await getUserBySession(user.sessionId), null);
  assertEquals(await getUserBySession(newSessionId), {
    ...user,
    sessionId: newSessionId,
  });

  await assertRejects(
    async () => await updateUserSession(user, newSessionId),
    Error,
    "Failed to update user session",
  );
});

Deno.test("[db] votes", async () => {
  const item = randomItem();
  const user = randomUser();
  const vote = {
    itemId: item.id,
    userLogin: user.login,
    createdAt: new Date(),
  };

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

  assertEquals(await collectValues(listItemsVotedByUser(user.login)), [item]);
  await assertRejects(async () => await createVote(vote));
});

Deno.test("[db] getAreVotedByUser()", async () => {
  const item = randomItem();
  const user = randomUser();
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
