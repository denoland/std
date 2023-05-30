// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { WEEK } from "std/datetime/constants.ts";

export const kv = await Deno.openKv();

// Helpers
async function getValue<T>(
  key: Deno.KvKey,
  options?: { consistency?: Deno.KvConsistencyLevel },
) {
  const res = await kv.get<T>(key, options);
  return res.value;
}

async function getValues<T>(
  selector: Deno.KvListSelector,
  options?: Deno.KvListOptions,
) {
  const values = [];
  const iter = kv.list<T>(selector, options);
  for await (const { value } of iter) values.push(value);
  return values;
}

// Item
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
  const item: Item = {
    id: crypto.randomUUID(),
    score: 0,
    createdAt: new Date(),
    ...initItem,
  };

  const itemKey = ["items", item.id];
  const itemByTime = ["items_by_time", item.createdAt.getTime(), item.id];
  const itemsByUserKey = ["items_by_user", item.userId, item.id];

  const res = await kv.atomic()
    .check({ key: itemKey, versionstamp: null })
    .check({ key: itemByTime, versionstamp: null })
    .check({ key: itemsByUserKey, versionstamp: null })
    .set(itemKey, item)
    .set(itemByTime, item)
    .set(itemsByUserKey, item)
    .commit();

  if (!res.ok) throw new Error(`Failed to set item: ${item}`);

  return item;
}

export async function getAllItemsInPastWeek() {
  return await getValues<Item>({
    prefix: ["items_by_time"],
    start: ["items_by_time", Date.now() - WEEK],
  });
}

export async function getItemById(id: string) {
  return await getValue<Item>(["items", id]);
}

export async function getItemByUser(userId: string, itemId: string) {
  return await getValue<Item>(["items_by_user", userId, itemId]);
}

export async function getItemsByUserId(userId: string) {
  return await getValues<Item>({ prefix: ["items_by_user", userId] });
}

// Comment
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
  const comment: Comment = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    ...initComment,
  };

  const commentsByItemKey = ["comments_by_item", comment.itemId, comment.id];
  const commentsByUserKey = ["comments_by_user", comment.userId, comment.id];

  const res = await kv.atomic()
    .check({ key: commentsByItemKey, versionstamp: null })
    .check({ key: commentsByUserKey, versionstamp: null })
    .set(commentsByItemKey, comment)
    .set(commentsByUserKey, comment)
    .commit();

  if (!res.ok) throw new Error(`Failed to create comment: ${comment}`);

  return comment;
}

export async function getCommentsByItem(itemId: string) {
  return await getValues<Comment>({ prefix: ["comments_by_item", itemId] });
}

// Vote
interface Vote {
  item: Item;
  user: User;
}

export async function createVote(vote: Vote) {
  vote.item.score++;

  const itemKey = ["items", vote.item.id];
  const itemsByTimeKey = [
    "items_by_time",
    vote.item.createdAt.getTime(),
    vote.item.id,
  ];
  const itemsByUserKey = ["items_by_user", vote.item.userId, vote.item.id];
  const votedItemsByUserKey = [
    "voted_items_by_user",
    vote.user.id,
    vote.item.id,
  ];
  const votedUsersByItemKey = [
    "voted_users_by_item",
    vote.item.id,
    vote.user.id,
  ];

  const [itemRes, itemsByTimeRes, itemsByUserRes] = await kv.getMany([
    itemKey,
    itemsByTimeKey,
    itemsByUserKey,
  ]);
  const res = await kv.atomic()
    .check(itemRes)
    .check(itemsByTimeRes)
    .check(itemsByUserRes)
    .check({ key: votedItemsByUserKey, versionstamp: null })
    .check({ key: votedUsersByItemKey, versionstamp: null })
    .set(itemKey, vote.item)
    .set(itemsByTimeKey, vote.item)
    .set(itemsByUserKey, vote.item)
    .set(votedItemsByUserKey, vote.item)
    .set(votedUsersByItemKey, vote.user)
    .commit();

  if (!res.ok) throw new Error(`Failed to set vote: ${vote}`);

  return vote;
}

export async function deleteVote(vote: Vote) {
  vote.item.score--;

  const itemKey = ["items", vote.item.id];
  const itemsByTimeKey = [
    "items_by_time",
    vote.item.createdAt.getTime(),
    vote.item.id,
  ];
  const itemsByUserKey = ["items_by_user", vote.item.userId, vote.item.id];
  const votedItemsByUserKey = [
    "voted_items_by_user",
    vote.user.id,
    vote.item.id,
  ];
  const votedUsersByItemKey = [
    "voted_users_by_item",
    vote.item.id,
    vote.user.id,
  ];

  const [itemRes, itemsByTimeRes, itemsByUserRes] = await kv.getMany([
    itemKey,
    itemsByTimeKey,
    itemsByUserKey,
  ]);
  const res = await kv.atomic()
    .check(itemRes)
    .check(itemsByTimeRes)
    .check(itemsByUserRes)
    .set(itemKey, vote.item)
    .set(itemsByTimeKey, vote.item)
    .set(itemsByUserKey, vote.item)
    .delete(votedItemsByUserKey)
    .delete(votedUsersByItemKey)
    .commit();

  if (!res.ok) throw new Error(`Failed to delete vote: ${vote}`);
}

export async function getVotedItemsByUser(userId: string) {
  return await getValues<Item>({ prefix: ["voted_items_by_user", userId] });
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

export async function createUser(initUser: InitUser) {
  const user: User = {
    isSubscribed: false,
    ...initUser,
  };

  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.login];
  const usersBySessionKey = ["users_by_session", user.sessionId];
  const usersByStripeCustomerKey = [
    "users_by_stripe_customer",
    user.stripeCustomerId,
  ];

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

  if (!res.ok) throw new Error(`Failed to create user: ${user}`);

  return user;
}

export async function updateUser(user: User) {
  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.login];
  const usersBySessionKey = ["users_by_session", user.sessionId];
  const usersByStripeCustomerKey = [
    "users_by_stripe_customer",
    user.stripeCustomerId,
  ];

  const res = await kv.atomic()
    .set(usersKey, user)
    .set(usersByLoginKey, user)
    .set(usersBySessionKey, user)
    .set(usersByStripeCustomerKey, user)
    .commit();

  if (!res.ok) throw new Error(`Failed to update user: ${user}`);
}

export async function updateUserIsSubscribed(
  user: User,
  isSubscribed: User["isSubscribed"],
) {
  await updateUser({ ...user, isSubscribed });
}

/** This assumes that the previous session has been cleared */
export async function setUserSessionId(user: User, sessionId: string) {
  await updateUser({ ...user, sessionId });
}

export async function deleteUserBySession(sessionId: string) {
  await kv.delete(["users_by_session", sessionId]);
}

export async function getUserById(id: string) {
  return await getValue<User>(["users", id]);
}

export async function getUserByLogin(login: string) {
  return await getValue<User>(["users_by_login", login]);
}

export async function getUserBySessionId(sessionId: string) {
  const usersBySessionKey = ["users_by_session", sessionId];
  return await getValue<User>(usersBySessionKey, {
    consistency: "eventual",
  }) ?? await getValue<User>(usersBySessionKey);
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  return await getValue<User>([
    "users_by_stripe_customer",
    stripeCustomerId,
  ]);
}

export async function getManyUsers(ids: string[]) {
  const keys = ids.map((id) => ["users", id]);
  const res = await kv.getMany<User[]>(keys);
  return res.map((entry) => entry.value!);
}

// Visit
export async function incrementVisitsPerDay(date: Date) {
  // convert to universal timezone (UTC)
  const visitsKey = [
    "visits",
    `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`,
  ];
  await kv.atomic()
    .sum(visitsKey, 1n)
    .commit();
}

export async function getVisitsPerDay(date: Date) {
  return await getValue<bigint>([
    "visits",
    `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`,
  ]);
}

export async function getAreVotedBySessionId(
  items: Item[],
  sessionId?: string,
) {
  if (!sessionId) return [];
  const sessionUser = await getUserBySessionId(sessionId);
  if (!sessionUser) return [];
  const votedItems = await getVotedItemsByUser(sessionUser.id);
  const votedItemIds = votedItems.map((item) => item.id);
  return items.map((item) => votedItemIds.includes(item.id));
}

export async function getAllVisitsPerDay(options?: Deno.KvListOptions) {
  const iter = await kv.list<bigint>({ prefix: ["visits"] }, options);
  const visits = [];
  const dates = [];
  for await (const res of iter) {
    visits.push(Number(res.value));
    dates.push(String(res.key[1]));
  }
  return { visits, dates };
}

export function compareScore(a: Item, b: Item) {
  return Number(b.score) - Number(a.score);
}
