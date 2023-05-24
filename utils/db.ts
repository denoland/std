// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { AssertionError } from "https://deno.land/std@0.186.0/testing/asserts.ts";

export const kv = await Deno.openKv();

interface InitItem {
  userId: string;
  title: string;
  url: string;
}

export interface Item extends InitItem {
  id: string;
  createdAt: Date;
  score: number;
}

export async function createItem(initItem: InitItem) {
  let res = { ok: false };
  while (!res.ok) {
    const id = crypto.randomUUID();
    const itemKey = ["items", id];
    const itemsByUserKey = ["items_by_user", initItem.userId, id];
    const item: Item = {
      ...initItem,
      id,
      score: 0,
      createdAt: new Date(),
    };

    res = await kv.atomic()
      .check({ key: itemKey, versionstamp: null })
      .check({ key: itemsByUserKey, versionstamp: null })
      .set(itemKey, item)
      .set(itemsByUserKey, item)
      .commit();

    return item;
  }
}

export async function getAllItems(options?: Deno.KvListOptions) {
  const iter = await kv.list<Item>({ prefix: ["items"] }, options);
  const items = [];
  for await (const res of iter) items.push(res.value);
  return {
    items,
    cursor: iter.cursor,
  };
}

export async function getItemById(id: string) {
  const res = await kv.get<Item>(["items", id]);
  return res.value;
}

export async function getItemByUser(userId: string, itemId: string) {
  const res = await kv.get<Item>(["items_by_users", userId, itemId]);
  return res.value;
}

interface InitComment {
  userId: string;
  itemId: string;
  text: string;
}

export interface Comment extends InitComment {
  id: string;
  createdAt: Date;
}

export async function createComment(initComment: InitComment) {
  let res = { ok: false };
  while (!res.ok) {
    const id = crypto.randomUUID();
    const commentsByUserKey = ["comments_by_users", initComment.userId, id];
    const commentsByItemKey = ["comments_by_item", initComment.itemId, id];
    const comment: Comment = { ...initComment, id, createdAt: new Date() };

    res = await kv.atomic()
      .check({ key: commentsByUserKey, versionstamp: null })
      .check({ key: commentsByItemKey, versionstamp: null })
      .set(commentsByUserKey, comment)
      .set(commentsByItemKey, comment)
      .commit();

    return comment;
  }
}

export async function getCommentsByItem(
  itemId: string,
  options?: Deno.KvListOptions,
) {
  const iter = await kv.list<Comment>({
    prefix: ["comments_by_item", itemId],
  }, options);
  const comments = [];
  for await (const res of iter) comments.push(res.value);
  return comments;
}

interface InitVote {
  userId: string;
  itemId: string;
}

export async function createVote(initVote: InitVote) {
  const itemKey = ["items", initVote.itemId];
  const voteByUserKey = ["votes_by_users", initVote.userId, initVote.itemId];

  let res = { ok: false };
  while (!res.ok) {
    const itemRes = await kv.get<Item>(itemKey);

    if (itemRes.value === null) throw new Error("Item does not exist");

    const itemByUserKey = [
      "items_by_user",
      itemRes.value.userId,
      itemRes.value.id,
    ];

    const itemByUserRes = await kv.get<Item>(itemByUserKey);

    if (itemByUserRes.value === null) {
      throw new Error("Item by user does not exist");
    }

    itemByUserRes.value.score++;
    itemRes.value.score++;

    res = await kv.atomic()
      .check({ key: voteByUserKey, versionstamp: null })
      .check(itemByUserRes)
      .check(itemRes)
      .set(itemByUserRes.key, itemByUserRes.value)
      .set(itemRes.key, itemRes.value)
      .set(voteByUserKey, undefined)
      .commit();
  }
}

export async function deleteVote(initVote: InitVote) {
  const itemKey = ["items", initVote.itemId];
  const voteByUserKey = ["votes_by_users", initVote.userId, initVote.itemId];

  let res = { ok: false };
  while (!res.ok) {
    const itemRes = await kv.get<Item>(itemKey);
    const voteByUserRes = await kv.get<Item>(voteByUserKey);

    if (itemRes.value === null) throw new Error("Item does not exist");

    const itemByUserKey = [
      "items_by_user",
      itemRes.value.userId,
      itemRes.value.id,
    ];

    const itemByUserRes = await kv.get<Item>(itemByUserKey);

    if (itemByUserRes.value === null) {
      throw new Error("Item by user does not exist");
    }
    if (voteByUserRes.value === null) return;

    itemByUserRes.value.score--;
    itemRes.value.score--;

    res = await kv.atomic()
      .check(itemByUserRes)
      .check(itemRes)
      .check(voteByUserRes)
      .set(itemByUserRes.key, itemByUserRes.value)
      .set(itemRes.key, itemRes.value)
      .delete(voteByUserKey)
      .commit();
  }
}

export async function getVotedItemIdsByUser(
  userId: string,
  options?: Deno.KvListOptions,
) {
  const iter = await kv.list<undefined>({
    prefix: ["votes_by_users", userId],
  }, options);
  const voteItemIds = [];
  for await (const res of iter) voteItemIds.push(res.key.at(-1) as string);
  return voteItemIds;
}

interface InitUser {
  id: string;
  login: string;
  avatarUrl: string;
  stripeCustomerId: string;
  sessionId: string;
}

export interface User extends InitUser {
  isSubscribed: boolean;
}

export async function createUser(user: InitUser) {
  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.login];
  const usersBySessionKey = ["users_by_session", user.sessionId];
  const usersByStripeCustomerKey = [
    "users_by_stripe_customer",
    user.stripeCustomerId,
  ];

  user = { ...user, isSubscribed: false } as User;

  const res = await kv.atomic()
    .check({ key: usersKey, versionstamp: null })
    .check({ key: usersByLoginKey, versionstamp: null })
    .check({ key: usersBySessionKey, versionstamp: null })
    .check({ key: usersByStripeCustomerKey, versionstamp: null })
    .set(usersKey, user)
    .set(usersByLoginKey, user)
    .set(usersBySessionKey, user)
    .set(usersByStripeCustomerKey, user)
    .commit();

  if (!res.ok) {
    throw res;
  }

  return user;
}

export async function getUserById(id: string) {
  const res = await kv.get<User>(["users", id]);
  return res.value;
}

export async function getUserByLogin(login: string) {
  const res = await kv.get<User>(["users_by_login", login]);
  return res.value;
}

export async function getUserBySessionId(sessionId: string) {
  let res = await kv.get<User>(["users_by_session", sessionId], {
    consistency: "eventual",
  });
  if (!res.value) {
    res = await kv.get<User>(["users_by_session", sessionId]);
  }
  return res.value;
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  const res = await kv.get<User>([
    "users_by_stripe_customer",
    stripeCustomerId,
  ]);
  return res.value;
}

function isEntry<T>(entry: Deno.KvEntryMaybe<T>) {
  return entry.versionstamp !== null;
}

function assertIsEntry<T>(
  entry: Deno.KvEntryMaybe<T>,
): asserts entry is Deno.KvEntry<T> {
  if (!isEntry(entry)) {
    throw new AssertionError(`${entry.key} does not exist`);
  }
}

export async function setUserSubscription(
  user: User,
  isSubscribed: User["isSubscribed"],
) {
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

  [
    userRes,
    userByLoginRes,
    userBySessionRes,
    userByStripeCustomerRes,
  ].forEach((res) => assertIsEntry<User>(res));

  user = { ...user, isSubscribed } as User;

  const res = await kv.atomic()
    .check(userRes)
    .check(userByLoginRes)
    .check(userBySessionRes)
    .check(userByStripeCustomerRes)
    .set(usersKey, user)
    .set(usersByLoginKey, user)
    .set(usersBySessionKey, user)
    .set(usersByStripeCustomerKey, user)
    .commit();

  if (!res.ok) {
    throw res;
  }
}

/** This assumes that the previous session has been cleared */
export async function setUserSession(
  user: Omit<User, "isSubscribed">,
  sessionId: string,
) {
  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.login];
  const usersBySessionKey = ["users_by_session", sessionId];
  const usersByStripeCustomerKey = [
    "users_by_stripe_customer",
    user.stripeCustomerId,
  ];

  const [
    userRes,
    userByLoginRes,
    userByStripeCustomerRes,
  ] = await kv.getMany<User[]>([
    usersKey,
    usersByLoginKey,
    usersByStripeCustomerKey,
  ]);

  [
    userRes,
    userByLoginRes,
    userByStripeCustomerRes,
  ].forEach((res) => assertIsEntry<User>(res));

  user = { ...user, sessionId } as User;

  const res = await kv.atomic()
    .check(userRes)
    .check(userByLoginRes)
    .check({ key: usersBySessionKey, versionstamp: null })
    .check(userByStripeCustomerRes)
    .set(usersKey, user)
    .set(usersByLoginKey, user)
    .set(usersBySessionKey, user)
    .set(usersByStripeCustomerKey, user)
    .commit();

  if (!res.ok) {
    throw res;
  }
}

export async function deleteUserBySession(sessionId: string) {
  await kv.delete(["users_by_session", sessionId]);
}

export async function getUsersByIds(ids: string[]) {
  const keys = ids.map((id) => ["users", id]);
  const res = await kv.getMany<User[]>(keys);
  return res.map((entry) => entry.value!);
}
